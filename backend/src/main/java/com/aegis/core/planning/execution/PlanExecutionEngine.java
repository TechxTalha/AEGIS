package com.aegis.core.planning.execution;

import com.aegis.core.planning.model.Plan;
import com.aegis.core.planning.model.PlanStatus;
import com.aegis.core.planning.model.PlanStep;
import com.aegis.core.planning.storage.PlanRepository;
import com.aegis.core.reasoning.engine.ToolReasoningService;
import com.aegis.core.reasoning.model.ToolInterpretationResponse;
import com.aegis.core.reasoning.model.ToolSelectionResponse;
import com.aegis.core.tool.executor.ToolExecutionEngine;
import com.aegis.core.tool.model.ToolInvocation;
import com.aegis.core.tool.model.ToolResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlanExecutionEngine {
    private static final Logger logger = LoggerFactory.getLogger(PlanExecutionEngine.class);
    private static final int MAX_RETRIES_PER_STEP = 3;

    private final ToolReasoningService reasoningService;
    private final ToolExecutionEngine executionEngine;
    private final PlanRepository planRepository;
    private final com.aegis.core.safety.service.ExecutionSafetyService safetyService;
    private final com.aegis.core.tool.registry.ToolRegistry toolRegistry;
    private final com.aegis.core.planning.recovery.FailureClassifierService failureClassifierService;

    public PlanExecutionEngine(ToolReasoningService reasoningService, ToolExecutionEngine executionEngine, PlanRepository planRepository, com.aegis.core.safety.service.ExecutionSafetyService safetyService, com.aegis.core.tool.registry.ToolRegistry toolRegistry, com.aegis.core.planning.recovery.FailureClassifierService failureClassifierService) {
        this.reasoningService = reasoningService;
        this.executionEngine = executionEngine;
        this.planRepository = planRepository;
        this.safetyService = safetyService;
        this.toolRegistry = toolRegistry;
        this.failureClassifierService = failureClassifierService;
    }

    public void executePlan(Plan plan) {
        if (plan == null || plan.getSteps() == null || plan.getSteps().isEmpty()) {
            logger.warn("Cannot execute null or empty plan");
            return;
        }

        plan.setStatus(PlanStatus.IN_PROGRESS);
        planRepository.save(plan);

        while (true) {
            PlanStep step = plan.getSteps().stream()
                    .filter(s -> s.getStatus() == PlanStatus.PENDING || s.getStatus() == PlanStatus.IN_PROGRESS)
                    .findFirst()
                    .orElse(null);

            if (step == null) {
                boolean hasFailures = plan.getSteps().stream().anyMatch(s -> s.getStatus() == PlanStatus.FAILED);
                if (hasFailures) {
                    plan.setStatus(PlanStatus.FAILED);
                } else {
                    plan.setStatus(PlanStatus.COMPLETED);
                    logger.info("Plan {} executed successfully", plan.getId());
                }
                planRepository.save(plan);
                return;
            }

            if (!areDependenciesMet(plan, step)) {
                logger.warn("Dependencies not met for step: {}. Halting execution.", step.getId());
                plan.setStatus(PlanStatus.FAILED);
                plan.setFailureSummary("Dependencies not met for step " + step.getId());
                planRepository.save(plan);
                return;
            }

            try {
                boolean stepSuccess = executeStepWithRetries(plan, step);
                if (!stepSuccess) {
                    if (step.getStatus() == PlanStatus.REQUIRES_HUMAN_INTERVENTION) {
                        plan.setStatus(PlanStatus.REQUIRES_HUMAN_INTERVENTION);
                    } else {
                        plan.setStatus(PlanStatus.FAILED);
                    }
                    planRepository.save(plan);
                    return;
                }
            } catch (com.aegis.core.safety.exception.RequiresApprovalException e) {
                logger.info("Plan execution paused. Awaiting approval for plan: {}", plan.getId());
                step.setStatus(PlanStatus.AWAITING_APPROVAL);
                plan.setStatus(PlanStatus.AWAITING_APPROVAL);
                planRepository.save(plan);
                return;
            }
            
            planRepository.save(plan);
        }
    }

    private boolean executeStepWithRetries(Plan plan, PlanStep step) {
        step.setStatus(PlanStatus.IN_PROGRESS);

        for (int attempt = 1; attempt <= MAX_RETRIES_PER_STEP; attempt++) {
            com.aegis.core.planning.recovery.FailureType failureType = com.aegis.core.planning.recovery.FailureType.TERMINAL;
            String failureContext = "Unknown failure";

            try {
                logger.info("Executing step: {} (Attempt {}/{})", step.getId(), attempt, MAX_RETRIES_PER_STEP);
                
                ToolSelectionResponse selection = reasoningService.selectTool(step, "Context Dump Simulation");
                if (selection == null || selection.getSelectedToolId() == null || selection.getSelectedToolId().isEmpty() || "null".equalsIgnoreCase(selection.getSelectedToolId())) {
                    logger.warn("Reasoner could not select a tool for step: {}", step.getId());
                    failureType = com.aegis.core.planning.recovery.FailureType.REQUIRES_REPLANNING;
                    failureContext = "No tool selected by reasoner";
                } else {
                    ToolInvocation invocation = new ToolInvocation();
                    invocation.setToolId(selection.getSelectedToolId());
                    invocation.setParameters(selection.getParameters());

                    java.util.Optional<com.aegis.core.tool.model.ToolDefinition> defOpt = toolRegistry.getTool(invocation.getToolId());
                    if (defOpt.isPresent()) {
                        safetyService.evaluateInvocation(step.getId(), invocation, defOpt.get());
                    }

                    ToolResult result = executionEngine.execute(invocation);

                    if (!result.isSuccess()) {
                        failureType = failureClassifierService.classify(result);
                        failureContext = "Tool execution failed: " + result.getErrorMessage();
                    } else {
                        ToolInterpretationResponse interpretation = reasoningService.interpretResult(step, invocation, result);

                        if (interpretation != null && interpretation.isSuccess()) {
                            step.setStatus(PlanStatus.COMPLETED);
                            step.setResult(interpretation.getInsights());
                            return true;
                        } else {
                            logger.warn("Step {} failed interpretation. Insights: {}", step.getId(), interpretation != null ? interpretation.getInsights() : "null");
                            failureType = com.aegis.core.planning.recovery.FailureType.REQUIRES_REPLANNING;
                            failureContext = "Interpretation failed: " + (interpretation != null ? interpretation.getInsights() : "null");
                        }
                    }
                }
            } catch (com.aegis.core.safety.exception.RequiresApprovalException e) {
                logger.warn("Step {} requires approval: {}", step.getId(), e.getMessage());
                throw e;
            } catch (SecurityException e) {
                logger.error("Security violation for step {}: {}", step.getId(), e.getMessage());
                step.setStatus(PlanStatus.FAILED);
                plan.setFailureSummary("Security violation: " + e.getMessage());
                return false;
            } catch (Exception e) {
                logger.error("Exception occurred while executing step: {}", step.getId(), e);
                failureType = failureClassifierService.classify(e);
                failureContext = "Exception: " + e.getMessage();
            }

            logger.info("Failure classified as {} for step {}", failureType, step.getId());
            if (failureType == com.aegis.core.planning.recovery.FailureType.TRANSIENT) {
                if (attempt < MAX_RETRIES_PER_STEP) {
                    logger.info("Transient failure, will retry step {}", step.getId());
                    try { Thread.sleep(1000L * attempt); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                    continue;
                }
            } else if (failureType == com.aegis.core.planning.recovery.FailureType.REQUIRES_REPLANNING) {
                com.aegis.core.planning.model.Plan newPlan = reasoningService.replan(plan, step, failureContext);
                if (newPlan != null) {
                    step.setStatus(PlanStatus.FAILED);
                    step.setResult("Failed and replanned: " + failureContext);
                    return true;
                }
            } else if (failureType == com.aegis.core.planning.recovery.FailureType.REQUIRES_HUMAN) {
                step.setStatus(PlanStatus.REQUIRES_HUMAN_INTERVENTION);
                plan.setFailureSummary(failureContext);
                return false;
            } else {
                break;
            }
        }

        step.setStatus(PlanStatus.FAILED);
        plan.setFailureSummary("Step " + step.getId() + " failed after max retries.");
        return false;
    }

    private boolean areDependenciesMet(Plan plan, PlanStep step) {
        List<String> deps = step.getDependencies();
        if (deps == null || deps.isEmpty()) {
            return true;
        }
        
        for (String depId : deps) {
            boolean isDepCompleted = plan.getSteps().stream()
                    .filter(s -> depId.equals(s.getId()))
                    .anyMatch(s -> s.getStatus() == PlanStatus.COMPLETED);
            if (!isDepCompleted) {
                return false;
            }
        }
        return true;
    }
}

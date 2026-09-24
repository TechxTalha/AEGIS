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

    public PlanExecutionEngine(ToolReasoningService reasoningService, ToolExecutionEngine executionEngine, PlanRepository planRepository) {
        this.reasoningService = reasoningService;
        this.executionEngine = executionEngine;
        this.planRepository = planRepository;
    }

    public void executePlan(Plan plan) {
        if (plan == null || plan.getSteps() == null || plan.getSteps().isEmpty()) {
            logger.warn("Cannot execute null or empty plan");
            return;
        }

        plan.setStatus(PlanStatus.IN_PROGRESS);
        planRepository.save(plan);

        for (PlanStep step : plan.getSteps()) {
            if (step.getStatus() == PlanStatus.COMPLETED) {
                continue; // Skip already completed steps if resuming
            }

            if (!areDependenciesMet(plan, step)) {
                logger.warn("Dependencies not met for step: {}. Halting execution.", step.getId());
                plan.setStatus(PlanStatus.FAILED);
                planRepository.save(plan);
                return;
            }

            boolean stepSuccess = executeStepWithRetries(step);

            if (!stepSuccess) {
                logger.error("Step {} failed after max retries. Halting plan execution.", step.getId());
                plan.setStatus(PlanStatus.FAILED);
                planRepository.save(plan);
                return;
            }
            
            // Save plan after each successful step to persist progress
            planRepository.save(plan);
        }

        plan.setStatus(PlanStatus.COMPLETED);
        planRepository.save(plan);
        logger.info("Plan {} executed successfully", plan.getId());
    }

    private boolean executeStepWithRetries(PlanStep step) {
        step.setStatus(PlanStatus.IN_PROGRESS);
        // We don't save per step here immediately to keep it simple, but we could if needed.

        for (int attempt = 1; attempt <= MAX_RETRIES_PER_STEP; attempt++) {
            try {
                logger.info("Executing step: {} (Attempt {}/{})", step.getId(), attempt, MAX_RETRIES_PER_STEP);
                
                // 1. Reasoning (Selection)
                ToolSelectionResponse selection = reasoningService.selectTool(step, "Context Dump Simulation");
                if (selection == null || selection.getSelectedToolId() == null || selection.getSelectedToolId().isEmpty() || "null".equalsIgnoreCase(selection.getSelectedToolId())) {
                    logger.warn("Reasoner could not select a tool for step: {}", step.getId());
                    // Treat as a failure, maybe unrecoverable if no tool matches, but we will retry.
                    continue;
                }

                // 2. Execution
                ToolInvocation invocation = new ToolInvocation();
                invocation.setToolId(selection.getSelectedToolId());
                invocation.setParameters(selection.getParameters());

                ToolResult result = executionEngine.execute(invocation);

                // 3. Reasoning (Interpretation)
                ToolInterpretationResponse interpretation = reasoningService.interpretResult(step, invocation, result);

                if (interpretation != null && interpretation.isSuccess()) {
                    step.setStatus(PlanStatus.COMPLETED);
                    step.setResult(interpretation.getInsights());
                    return true;
                } else {
                    logger.warn("Step {} failed interpretation. Insights: {}", step.getId(), interpretation != null ? interpretation.getInsights() : "null");
                }
            } catch (Exception e) {
                logger.error("Exception occurred while executing step: {}", step.getId(), e);
            }
        }

        step.setStatus(PlanStatus.FAILED);
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

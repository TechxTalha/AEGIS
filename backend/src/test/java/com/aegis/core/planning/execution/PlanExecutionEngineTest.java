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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class PlanExecutionEngineTest {

    private ToolReasoningService reasoningService;
    private ToolExecutionEngine executionEngine;
    private PlanRepository planRepository;
    private com.aegis.core.safety.service.ExecutionSafetyService safetyService;
    private com.aegis.core.tool.registry.ToolRegistry toolRegistry;
    private com.aegis.core.planning.recovery.FailureClassifierService failureClassifierService;
    private PlanExecutionEngine planExecutionEngine;

    @BeforeEach
    void setUp() {
        reasoningService = mock(ToolReasoningService.class);
        executionEngine = mock(ToolExecutionEngine.class);
        planRepository = mock(PlanRepository.class);
        safetyService = mock(com.aegis.core.safety.service.ExecutionSafetyService.class);
        toolRegistry = mock(com.aegis.core.tool.registry.ToolRegistry.class);
        failureClassifierService = new com.aegis.core.planning.recovery.FailureClassifierService();
        planExecutionEngine = new PlanExecutionEngine(reasoningService, executionEngine, planRepository, safetyService, toolRegistry, failureClassifierService);
    }

    @Test
    void testExecutePlanSuccessfully() throws Exception {
        Plan plan = new Plan();
        plan.setId("plan-1");

        PlanStep step1 = new PlanStep();
        step1.setId("step-1");
        step1.setDescription("First step");
        step1.setStatus(PlanStatus.PENDING);

        PlanStep step2 = new PlanStep();
        step2.setId("step-2");
        step2.setDescription("Second step");
        step2.setStatus(PlanStatus.PENDING);
        step2.setDependencies(List.of("step-1"));

        plan.setSteps(new java.util.ArrayList<>(List.of(step1, step2)));

        // Mock reasoning and execution for step 1
        ToolSelectionResponse selection1 = new ToolSelectionResponse();
        selection1.setSelectedToolId("tool-1");
        selection1.setParameters(Map.of("param", "value1"));
        when(reasoningService.selectTool(eq(step1), any())).thenReturn(selection1);

        ToolResult result1 = new ToolResult();
        result1.setSuccess(true);
        when(executionEngine.execute(argThat(i -> i != null && "tool-1".equals(i.getToolId())))).thenReturn(result1);

        ToolInterpretationResponse interpretation1 = new ToolInterpretationResponse();
        interpretation1.setSuccess(true);
        interpretation1.setInsights("Step 1 completed");
        when(reasoningService.interpretResult(eq(step1), any(), eq(result1))).thenReturn(interpretation1);

        // Mock reasoning and execution for step 2
        ToolSelectionResponse selection2 = new ToolSelectionResponse();
        selection2.setSelectedToolId("tool-2");
        selection2.setParameters(Map.of("param", "value2"));
        when(reasoningService.selectTool(eq(step2), any())).thenReturn(selection2);

        ToolResult result2 = new ToolResult();
        result2.setSuccess(true);
        when(executionEngine.execute(argThat(i -> i != null && "tool-2".equals(i.getToolId())))).thenReturn(result2);

        ToolInterpretationResponse interpretation2 = new ToolInterpretationResponse();
        interpretation2.setSuccess(true);
        interpretation2.setInsights("Step 2 completed");
        when(reasoningService.interpretResult(eq(step2), any(), eq(result2))).thenReturn(interpretation2);

        // Execute
        planExecutionEngine.executePlan(plan);

        // Verify
        assertEquals(PlanStatus.COMPLETED, plan.getStatus());
        assertEquals(PlanStatus.COMPLETED, step1.getStatus());
        assertEquals("Step 1 completed", step1.getResult());
        assertEquals(PlanStatus.COMPLETED, step2.getStatus());
        assertEquals("Step 2 completed", step2.getResult());

        verify(planRepository, atLeastOnce()).save(plan);
    }

    @Test
    void testExecutePlanAwaitingApproval() throws Exception {
        Plan plan = new Plan();
        plan.setId("plan-3");

        PlanStep step1 = new PlanStep();
        step1.setId("step-1");
        step1.setStatus(PlanStatus.PENDING);
        plan.setSteps(new java.util.ArrayList<>(List.of(step1)));

        ToolSelectionResponse selection = new ToolSelectionResponse();
        selection.setSelectedToolId("tool-high-risk");
        when(reasoningService.selectTool(eq(step1), any())).thenReturn(selection);

        com.aegis.core.tool.model.ToolDefinition def = new com.aegis.core.tool.model.ToolDefinition();
        def.setId("tool-high-risk");
        when(toolRegistry.getTool("tool-high-risk")).thenReturn(java.util.Optional.of(def));

        doThrow(new com.aegis.core.safety.exception.RequiresApprovalException("Requires Approval", new com.aegis.core.safety.model.ApprovalRequest()))
            .when(safetyService).evaluateInvocation(eq("step-1"), any(), eq(def));

        planExecutionEngine.executePlan(plan);

        assertEquals(PlanStatus.AWAITING_APPROVAL, plan.getStatus());
        assertEquals(PlanStatus.AWAITING_APPROVAL, step1.getStatus());
        verify(planRepository, atLeastOnce()).save(plan);
    }

    @Test
    void testExecutePlanFailsWhenToolSelectionFails() throws Exception {
        Plan plan = new Plan();
        plan.setId("plan-2");

        PlanStep step1 = new PlanStep();
        step1.setId("step-1");
        step1.setStatus(PlanStatus.PENDING);
        plan.setSteps(new java.util.ArrayList<>(List.of(step1)));

        when(reasoningService.selectTool(eq(step1), any())).thenReturn(null);

        planExecutionEngine.executePlan(plan);

        assertEquals(PlanStatus.FAILED, plan.getStatus());
        assertEquals(PlanStatus.FAILED, step1.getStatus());
    }
}

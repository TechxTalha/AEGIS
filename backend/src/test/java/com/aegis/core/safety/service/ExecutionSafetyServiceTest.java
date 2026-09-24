package com.aegis.core.safety.service;

import com.aegis.core.safety.exception.RequiresApprovalException;
import com.aegis.core.safety.model.ApprovalRequest;
import com.aegis.core.safety.model.ApprovalStatus;
import com.aegis.core.tool.model.ToolInvocation;
import com.aegis.core.tool.model.RiskLevel;
import com.aegis.core.tool.model.ToolDefinition;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ExecutionSafetyServiceTest {

    private ExecutionSafetyService safetyService;
    private SecurityPolicy securityPolicy;

    @BeforeEach
    void setUp() {
        securityPolicy = new DefaultSecurityPolicy();
        safetyService = new ExecutionSafetyService(securityPolicy);
    }

    @Test
    void testLowRiskProceedsWithoutApproval() {
        ToolInvocation invocation = new ToolInvocation();
        invocation.setToolId("read-file");

        ToolDefinition definition = new ToolDefinition();
        definition.setId("read-file");
        definition.setRiskLevel(RiskLevel.LOW);

        assertDoesNotThrow(() -> safetyService.evaluateInvocation("step-1", invocation, definition));
    }

    @Test
    void testHighRiskThrowsRequiresApprovalException() {
        ToolInvocation invocation = new ToolInvocation();
        invocation.setToolId("delete-db");

        ToolDefinition definition = new ToolDefinition();
        definition.setId("delete-db");
        definition.setRiskLevel(RiskLevel.HIGH);

        RequiresApprovalException ex = assertThrows(RequiresApprovalException.class, 
                () -> safetyService.evaluateInvocation("step-1", invocation, definition));
        
        assertNotNull(ex.getApprovalRequest());
        assertEquals("step-1", ex.getApprovalRequest().getPlanStepId());
        assertEquals(ApprovalStatus.PENDING, ex.getApprovalRequest().getStatus());
    }

    @Test
    void testHighRiskFailsIfRejected() {
        ToolInvocation invocation = new ToolInvocation();
        invocation.setToolId("delete-db");

        ToolDefinition definition = new ToolDefinition();
        definition.setId("delete-db");
        definition.setRiskLevel(RiskLevel.CRITICAL);

        RequiresApprovalException ex = assertThrows(RequiresApprovalException.class, 
                () -> safetyService.evaluateInvocation("step-1", invocation, definition));
        
        ApprovalRequest request = ex.getApprovalRequest();
        safetyService.rejectRequest(request.getId());

        assertThrows(SecurityException.class, () -> safetyService.evaluateInvocation("step-1", invocation, definition));
    }

    @Test
    void testHighRiskProceedsIfApproved() {
        ToolInvocation invocation = new ToolInvocation();
        invocation.setToolId("delete-db");

        ToolDefinition definition = new ToolDefinition();
        definition.setId("delete-db");
        definition.setRiskLevel(RiskLevel.CRITICAL);

        RequiresApprovalException ex = assertThrows(RequiresApprovalException.class, 
                () -> safetyService.evaluateInvocation("step-1", invocation, definition));
        
        ApprovalRequest request = ex.getApprovalRequest();
        safetyService.approveRequest(request.getId());

        assertDoesNotThrow(() -> safetyService.evaluateInvocation("step-1", invocation, definition));
    }
}

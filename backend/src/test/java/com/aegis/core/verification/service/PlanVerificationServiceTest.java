package com.aegis.core.verification.service;

import com.aegis.core.model.gateway.dto.ModelRequest;
import com.aegis.core.model.gateway.dto.ModelResponse;
import com.aegis.core.model.gateway.service.ModelGatewayService;
import com.aegis.core.planning.model.Plan;
import com.aegis.core.planning.model.PlanStatus;
import com.aegis.core.planning.model.PlanStep;
import com.aegis.core.verification.model.VerificationResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PlanVerificationServiceTest {

    private ModelGatewayService modelGatewayService;
    private PlanVerificationService verificationService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        modelGatewayService = mock(ModelGatewayService.class);
        objectMapper = new ObjectMapper();
        verificationService = new PlanVerificationService(modelGatewayService, objectMapper);
    }

    @Test
    void testVerifyPlanOutcomeSuccess() throws Exception {
        Plan plan = new Plan();
        plan.setId("plan-1");
        plan.setObjective("Fix the bug in login");

        PlanStep step1 = new PlanStep();
        step1.setId("step-1");
        step1.setDescription("Locate bug");
        step1.setStatus(PlanStatus.COMPLETED);
        step1.setResult("Found bug in auth.js");

        PlanStep step2 = new PlanStep();
        step2.setId("step-2");
        step2.setDescription("Fix bug");
        step2.setStatus(PlanStatus.COMPLETED);
        step2.setResult("Fixed logic and tests passed");

        plan.setSteps(List.of(step1, step2));

        String mockJsonResponse = "{\n" +
                "  \"verified\": true,\n" +
                "  \"reasoning\": \"All evidence indicates the bug was found and tests passed.\",\n" +
                "  \"discrepancies\": []\n" +
                "}";
        ModelResponse mockResponse = new ModelResponse();
        mockResponse.setContent(mockJsonResponse);
        when(modelGatewayService.generate(any(ModelRequest.class))).thenReturn(mockResponse);

        VerificationResult result = verificationService.verifyPlanOutcome(plan);

        assertNotNull(result);
        assertTrue(result.isVerified());
        assertEquals("All evidence indicates the bug was found and tests passed.", result.getReasoning());
        assertTrue(result.getDiscrepancies().isEmpty());
    }

    @Test
    void testVerifyPlanOutcomeFailure() throws Exception {
        Plan plan = new Plan();
        plan.setId("plan-2");
        plan.setObjective("Create a secure database");

        PlanStep step1 = new PlanStep();
        step1.setId("step-1");
        step1.setDescription("Init DB");
        step1.setStatus(PlanStatus.COMPLETED);
        step1.setResult("DB initialized with default password");

        plan.setSteps(List.of(step1));

        String mockJsonResponse = "{\n" +
                "  \"verified\": false,\n" +
                "  \"reasoning\": \"The database was initialized but uses a default password, which is not secure.\",\n" +
                "  \"discrepancies\": [\"Default password used instead of secure authentication\"]\n" +
                "}";
        ModelResponse mockResponse = new ModelResponse();
        mockResponse.setContent(mockJsonResponse);
        when(modelGatewayService.generate(any(ModelRequest.class))).thenReturn(mockResponse);

        VerificationResult result = verificationService.verifyPlanOutcome(plan);

        assertNotNull(result);
        assertFalse(result.isVerified());
        assertEquals(1, result.getDiscrepancies().size());
        assertEquals("Default password used instead of secure authentication", result.getDiscrepancies().get(0));
    }
}

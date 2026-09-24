package com.aegis.core.planning.engine;

import com.aegis.core.model.gateway.dto.ModelResponse;
import com.aegis.core.model.gateway.service.ModelGatewayService;
import com.aegis.core.planning.model.Plan;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PlannerServiceTest {

    private ModelGatewayService modelGatewayService;
    private PlannerService plannerService;

    @BeforeEach
    void setUp() {
        modelGatewayService = mock(ModelGatewayService.class);
        plannerService = new PlannerService(modelGatewayService, new ObjectMapper());
    }

    @Test
    void testGeneratePlan() throws Exception {
        String mockJsonResponse = "Here is the plan:\n```json\n{\n" +
                "  \"objective\": \"Compile the project\",\n" +
                "  \"steps\": [\n" +
                "    {\n" +
                "      \"id\": \"step-1\",\n" +
                "      \"description\": \"Run maven compile\",\n" +
                "      \"requiredCapabilities\": [\"maven\", \"java\"],\n" +
                "      \"dependencies\": []\n" +
                "    }\n" +
                "  ]\n" +
                "}\n```\nHope this helps!";

        ModelResponse mockResponse = new ModelResponse();
        mockResponse.setContent(mockJsonResponse);

        when(modelGatewayService.generate(any())).thenReturn(mockResponse);

        Plan plan = plannerService.generatePlan("Compile the project");

        assertNotNull(plan);
        assertNotNull(plan.getId());
        assertEquals("Compile the project", plan.getObjective());
        assertEquals(1, plan.getSteps().size());
        assertEquals("step-1", plan.getSteps().get(0).getId());
        assertEquals("Run maven compile", plan.getSteps().get(0).getDescription());
        assertEquals(2, plan.getSteps().get(0).getRequiredCapabilities().size());
        assertEquals(0, plan.getSteps().get(0).getDependencies().size());
    }
}

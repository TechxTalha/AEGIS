package com.aegis.core.reasoning.engine;

import com.aegis.core.model.gateway.dto.ModelResponse;
import com.aegis.core.model.gateway.service.ModelGatewayService;
import com.aegis.core.planning.model.PlanStep;
import com.aegis.core.reasoning.model.ToolInterpretationResponse;
import com.aegis.core.reasoning.model.ToolSelectionResponse;
import com.aegis.core.tool.model.ToolInvocation;
import com.aegis.core.tool.model.ToolResult;
import com.aegis.core.tool.model.ToolDefinition;
import com.aegis.core.tool.registry.ToolRegistry;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ToolReasoningServiceTest {

    private ModelGatewayService modelGatewayService;
    private ToolRegistry toolRegistry;
    private ToolReasoningService reasoningService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        modelGatewayService = mock(ModelGatewayService.class);
        toolRegistry = mock(ToolRegistry.class);
        objectMapper = new ObjectMapper();
        reasoningService = new ToolReasoningService(modelGatewayService, toolRegistry, objectMapper);
    }

    @Test
    void testSelectTool() throws Exception {
        ToolDefinition mockTool = new ToolDefinition();
        mockTool.setId("execute_shell");
        mockTool.setCapabilityMetadata(Map.of("shell", "true"));

        when(toolRegistry.getAllTools()).thenReturn(List.of(mockTool));

        String mockJsonResponse = "{\n" +
                "  \"selectedToolId\": \"execute_shell\",\n" +
                "  \"parameters\": { \"command\": \"ls -la\" },\n" +
                "  \"rationale\": \"Checking directory contents\"\n" +
                "}";
        ModelResponse mockResponse = new ModelResponse();
        mockResponse.setContent(mockJsonResponse);
        when(modelGatewayService.generate(any())).thenReturn(mockResponse);

        PlanStep step = new PlanStep();
        step.setDescription("List the files in the directory");
        step.setRequiredCapabilities(List.of("shell"));

        ToolSelectionResponse response = reasoningService.selectTool(step, "CWD: /home/user");

        assertNotNull(response);
        assertEquals("execute_shell", response.getSelectedToolId());
        assertEquals("ls -la", response.getParameters().get("command"));
        assertEquals("Checking directory contents", response.getRationale());
    }

    @Test
    void testInterpretResult() throws Exception {
        String mockJsonResponse = "{\n" +
                "  \"success\": true,\n" +
                "  \"insights\": \"The file exists\",\n" +
                "  \"nextRecommendedAction\": \"Proceed to next step\"\n" +
                "}";
        ModelResponse mockResponse = new ModelResponse();
        mockResponse.setContent(mockJsonResponse);
        when(modelGatewayService.generate(any())).thenReturn(mockResponse);

        PlanStep step = new PlanStep();
        step.setDescription("Check if file exists");

        ToolInvocation invocation = new ToolInvocation();
        invocation.setToolId("execute_shell");
        invocation.setParameters(Map.of("command", "ls test.txt"));

        ToolResult result = new ToolResult();
        result.setSuccess(true);
        result.setPayload("test.txt\n");

        ToolInterpretationResponse response = reasoningService.interpretResult(step, invocation, result);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals("The file exists", response.getInsights());
        assertEquals("Proceed to next step", response.getNextRecommendedAction());
    }
}

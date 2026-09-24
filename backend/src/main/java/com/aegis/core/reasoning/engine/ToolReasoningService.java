package com.aegis.core.reasoning.engine;

import com.aegis.core.model.gateway.dto.ModelMessage;
import com.aegis.core.model.gateway.dto.ModelRequest;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ToolReasoningService {
    private static final Logger logger = LoggerFactory.getLogger(ToolReasoningService.class);

    private final ModelGatewayService modelGatewayService;
    private final ToolRegistry toolRegistry;
    private final ObjectMapper objectMapper;

    private static final String SELECTION_PROMPT = "You are AEGIS Tool Reasoner. " +
            "Your task is to select the most appropriate tool to achieve a given objective and provide the necessary parameters.\n" +
            "You MUST respond with strictly valid JSON matching this schema:\n" +
            "{\n" +
            "  \"selectedToolId\": \"[the ID of the tool you chose, or null if none apply]\",\n" +
            "  \"parameters\": { \"key\": \"value\" },\n" +
            "  \"rationale\": \"[brief explanation of why this tool and parameters were chosen]\"\n" +
            "}\n" +
            "Do not include markdown wrappers or any conversational text.";

    private static final String INTERPRETATION_PROMPT = "You are AEGIS Result Interpreter. " +
            "Your task is to analyze the raw output of a tool execution and determine if the objective was met.\n" +
            "You MUST respond with strictly valid JSON matching this schema:\n" +
            "{\n" +
            "  \"success\": true/false,\n" +
            "  \"insights\": \"[what was learned from the output?]\",\n" +
            "  \"nextRecommendedAction\": \"[what should the agent do next?]\"\n" +
            "}\n" +
            "Do not include markdown wrappers or any conversational text.";

    public ToolReasoningService(ModelGatewayService modelGatewayService, ToolRegistry toolRegistry, ObjectMapper objectMapper) {
        this.modelGatewayService = modelGatewayService;
        this.toolRegistry = toolRegistry;
        this.objectMapper = objectMapper;
    }

    public ToolSelectionResponse selectTool(PlanStep step, String contextDump) throws Exception {
        List<String> requiredCaps = step.getRequiredCapabilities() != null ? step.getRequiredCapabilities() : java.util.Collections.emptyList();
        List<ToolDefinition> availableTools = toolRegistry.getAllTools().stream()
                .filter(t -> requiredCaps.isEmpty() || 
                        (t.getCapabilityMetadata() != null && t.getCapabilityMetadata().keySet().stream().anyMatch(cap -> requiredCaps.contains(cap))))
                .collect(Collectors.toList());

        String userPrompt = String.format(
                "Objective: %s\nContext: %s\nAvailable Tools:\n%s",
                step.getDescription(),
                contextDump != null ? contextDump : "None",
                objectMapper.writeValueAsString(availableTools)
        );

        ModelRequest request = new ModelRequest();
        request.setMessages(List.of(
                ModelMessage.system(SELECTION_PROMPT),
                ModelMessage.user(userPrompt)
        ));

        ModelResponse response = modelGatewayService.generate(request);
        String jsonContent = extractJson(response.getContent());
        return objectMapper.readValue(jsonContent, ToolSelectionResponse.class);
    }

    public ToolInterpretationResponse interpretResult(PlanStep step, ToolInvocation invocation, ToolResult result) throws Exception {
        String userPrompt = String.format(
                "Objective: %s\nTool Invoked: %s\nParameters: %s\nExecution Result (Success=%s):\n%s",
                step.getDescription(),
                invocation.getToolId(),
                objectMapper.writeValueAsString(invocation.getParameters()),
                result.isSuccess(),
                result.isSuccess() ? result.getPayload() : result.getErrorMessage()
        );

        ModelRequest request = new ModelRequest();
        request.setMessages(List.of(
                ModelMessage.system(INTERPRETATION_PROMPT),
                ModelMessage.user(userPrompt)
        ));

        ModelResponse response = modelGatewayService.generate(request);
        String jsonContent = extractJson(response.getContent());
        return objectMapper.readValue(jsonContent, ToolInterpretationResponse.class);
    }

    public com.aegis.core.planning.model.Plan replan(com.aegis.core.planning.model.Plan currentPlan, PlanStep failedStep, String failureContext) {
        // Real implementation would invoke LLM to mutate the plan.
        // For now, we simulate adding a retry/fallback step.
        logger.info("Replanning due to failure in step: {}. Context: {}", failedStep.getId(), failureContext);

        PlanStep fallbackStep = new PlanStep();
        fallbackStep.setId(java.util.UUID.randomUUID().toString());
        fallbackStep.setDescription("Fallback strategy for: " + failedStep.getDescription());
        fallbackStep.setStatus(com.aegis.core.planning.model.PlanStatus.PENDING);
        
        // We will just append it for simplicity in simulation.
        currentPlan.getSteps().add(fallbackStep);
        return currentPlan;
    }

    private String extractJson(String text) {
        if (text == null) return "{}";
        String trimmed = text.trim();
        int startIndex = trimmed.indexOf("{");
        int endIndex = trimmed.lastIndexOf("}");
        if (startIndex != -1 && endIndex != -1 && endIndex >= startIndex) {
            return trimmed.substring(startIndex, endIndex + 1);
        }
        return trimmed;
    }
}

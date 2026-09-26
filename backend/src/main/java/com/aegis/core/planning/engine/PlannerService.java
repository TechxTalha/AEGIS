package com.aegis.core.planning.engine;

import com.aegis.core.model.gateway.dto.ModelMessage;
import com.aegis.core.model.gateway.dto.ModelRequest;
import com.aegis.core.model.gateway.dto.ModelResponse;
import com.aegis.core.model.gateway.service.ModelGatewayService;
import com.aegis.core.planning.model.Plan;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.aegis.core.memory.longterm.service.LongTermMemoryService;

@Service
public class PlannerService {

    private final ModelGatewayService modelGatewayService;
    private final ObjectMapper objectMapper;
    private final LongTermMemoryService memoryService;

    private static final String PLANNER_PROMPT = "You are AEGIS Planner, an AI module responsible for " +
            "translating natural language objectives into a structured, executable JSON plan.\n" +
            "You must respond with ONLY valid JSON adhering strictly to this structure:\n" +
            "{\n" +
            "  \"objective\": \"[the overall goal]\",\n" +
            "  \"steps\": [\n" +
            "    {\n" +
            "      \"id\": \"step-1\",\n" +
            "      \"description\": \"[what to do]\",\n" +
            "      \"requiredCapabilities\": [\"tool_name_or_category\"],\n" +
            "      \"dependencies\": []\n" +
            "    }\n" +
            "  ]\n" +
            "}\n" +
            "Do not include any Markdown blocks, formatting, or conversational text.\n\n" +
            "Context / Long-Term Memories:\n%s";

    public PlannerService(ModelGatewayService modelGatewayService, ObjectMapper objectMapper, LongTermMemoryService memoryService) {
        this.modelGatewayService = modelGatewayService;
        this.objectMapper = objectMapper;
        this.memoryService = memoryService;
    }

    public Plan generatePlan(String objective) throws Exception {
        String memoriesText = memoryService.getAllMemories().stream()
                .map(m -> "- [" + m.getCategory().name() + "] " + m.getContent())
                .collect(Collectors.joining("\n"));
        if (memoriesText.isEmpty()) {
            memoriesText = "No relevant memories found.";
        }

        String finalPrompt = String.format(PLANNER_PROMPT, memoriesText);

        ModelRequest request = new ModelRequest();
        request.setMessages(List.of(
                ModelMessage.system(finalPrompt),
                ModelMessage.user("Create a detailed plan for the following objective: " + objective)
        ));

        ModelResponse response = modelGatewayService.generate(request);

        String jsonContent = response.getContent().trim();
        // Extract JSON reliably by finding the first '{' and the last '}'
        int startIndex = jsonContent.indexOf("{");
        int endIndex = jsonContent.lastIndexOf("}");
        if (startIndex != -1 && endIndex != -1 && endIndex >= startIndex) {
            jsonContent = jsonContent.substring(startIndex, endIndex + 1);
        }

        Plan plan = objectMapper.readValue(jsonContent, Plan.class);
        plan.setId(UUID.randomUUID().toString());

        if (plan.getObjective() == null || plan.getObjective().trim().isEmpty()) {
            plan.setObjective(objective);
        }

        if (plan.getSteps() != null) {
            for (com.aegis.core.planning.model.PlanStep step : plan.getSteps()) {
                if (step.getId() == null || step.getId().trim().isEmpty()) {
                    step.setId(UUID.randomUUID().toString());
                }
            }
        }

        return plan;
    }
}

package com.aegis.core.verification.service;

import com.aegis.core.model.gateway.dto.ModelRequest;
import com.aegis.core.model.gateway.dto.ModelResponse;
import com.aegis.core.model.gateway.service.ModelGatewayService;
import com.aegis.core.planning.model.Plan;
import com.aegis.core.planning.model.PlanStatus;
import com.aegis.core.planning.model.PlanStep;
import com.aegis.core.verification.model.Evidence;
import com.aegis.core.verification.model.VerificationResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PlanVerificationService {
    private static final Logger logger = LoggerFactory.getLogger(PlanVerificationService.class);
    private final ModelGatewayService modelGatewayService;
    private final ObjectMapper objectMapper;

    public PlanVerificationService(ModelGatewayService modelGatewayService, ObjectMapper objectMapper) {
        this.modelGatewayService = modelGatewayService;
        this.objectMapper = objectMapper;
    }

    public VerificationResult verifyPlanOutcome(Plan plan) throws Exception {
        if (plan == null || plan.getSteps() == null) {
            throw new IllegalArgumentException("Plan or plan steps cannot be null");
        }

        List<Evidence> evidenceList = plan.getSteps().stream()
                .filter(step -> step.getStatus() == PlanStatus.COMPLETED)
                .map(step -> new Evidence(step.getId(), step.getDescription(), step.getResult()))
                .collect(Collectors.toList());

        String evidenceJson = objectMapper.writeValueAsString(evidenceList);

        String prompt = String.format(
                "You are AEGIS, an autonomous agent verifier.\n" +
                "Your task is to determine if the overarching objective was actually met, based on the execution evidence.\n\n" +
                "Objective: %s\n" +
                "Evidence from completed steps:\n%s\n\n" +
                "Respond strictly in JSON matching this schema:\n" +
                "{\n" +
                "  \"verified\": true/false,\n" +
                "  \"reasoning\": \"Explanation of your decision\",\n" +
                "  \"discrepancies\": [\"List of missed requirements or unfulfilled goals\", ...]\n" +
                "}\n" +
                "If the objective was completely met, set verified to true and discrepancies to an empty list.\n" +
                "If any part of the objective was not met or if evidence is insufficient, set verified to false and list the discrepancies.",
                plan.getObjective(),
                evidenceJson
        );

        ModelRequest request = new ModelRequest();
        request.setMessages(List.of(com.aegis.core.model.gateway.dto.ModelMessage.user(prompt)));
        request.setTemperature(0.1);

        logger.info("Verifying plan {} against objective: {}", plan.getId(), plan.getObjective());
        ModelResponse response = modelGatewayService.generate(request);

        String jsonContent = extractJson(response.getContent());
        return objectMapper.readValue(jsonContent, VerificationResult.class);
    }

    private String extractJson(String text) {
        if (text == null) return "";
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            return text.substring(start, end + 1);
        }
        return text.trim();
    }
}

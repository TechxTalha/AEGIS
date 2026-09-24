package com.aegis.core.model.gateway.provider;

import com.aegis.core.model.gateway.dto.*;
import com.aegis.core.model.gateway.exception.ModelGatewayException;
import com.aegis.core.model.gateway.exception.RateLimitException;
import com.aegis.core.tool.model.ToolDefinition;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

public class OpenAICompatibleProvider implements ModelProvider {
    private static final Logger logger = LoggerFactory.getLogger(OpenAICompatibleProvider.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String endpoint;
    private final String apiKey;
    private final String modelName;

    public OpenAICompatibleProvider(RestTemplate restTemplate, ObjectMapper objectMapper, String endpoint, String apiKey, String modelName) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.endpoint = endpoint;
        this.apiKey = apiKey;
        this.modelName = modelName;
    }

    @Override
    public String getProviderName() {
        return "OpenAICompatible(" + modelName + ")";
    }

    @Override
    public ModelResponse generate(ModelRequest request) throws ModelGatewayException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", modelName);
        if (request.getTemperature() != null) {
            body.put("temperature", request.getTemperature());
        }

        ArrayNode messagesArray = body.putArray("messages");
        for (ModelMessage msg : request.getMessages()) {
            ObjectNode msgNode = objectMapper.createObjectNode();
            msgNode.put("role", msg.getRole().name().toLowerCase());
            if (msg.getContent() != null) {
                msgNode.put("content", msg.getContent());
            }
            if (msg.getRole() == Role.TOOL && msg.getToolCallId() != null) {
                msgNode.put("tool_call_id", msg.getToolCallId());
            }
            if (msg.getRole() == Role.ASSISTANT && msg.getToolCalls() != null && !msg.getToolCalls().isEmpty()) {
                ArrayNode toolCallsArray = msgNode.putArray("tool_calls");
                for (ToolCallRequest tc : msg.getToolCalls()) {
                    ObjectNode tcNode = objectMapper.createObjectNode();
                    tcNode.put("id", tc.getId());
                    tcNode.put("type", "function");
                    ObjectNode functionNode = tcNode.putObject("function");
                    functionNode.put("name", tc.getName());
                    try {
                        functionNode.put("arguments", objectMapper.writeValueAsString(tc.getArguments()));
                    } catch (JsonProcessingException e) {
                        throw new ModelGatewayException("Failed to serialize tool call arguments", e);
                    }
                    toolCallsArray.add(tcNode);
                }
            }
            messagesArray.add(msgNode);
        }

        if (request.getTools() != null && !request.getTools().isEmpty()) {
            ArrayNode toolsArray = body.putArray("tools");
            for (ToolDefinition td : request.getTools()) {
                ObjectNode tNode = objectMapper.createObjectNode();
                tNode.put("type", "function");
                ObjectNode fNode = tNode.putObject("function");
                fNode.put("name", td.getId());
                fNode.put("description", td.getDescription());
                try {
                    if (td.getInputSchema() != null && !td.getInputSchema().trim().isEmpty()) {
                        JsonNode schemaNode = objectMapper.readTree(td.getInputSchema());
                        fNode.set("parameters", schemaNode);
                    } else {
                        // Provide empty object schema if null
                        ObjectNode emptySchema = objectMapper.createObjectNode();
                        emptySchema.put("type", "object");
                        emptySchema.putObject("properties");
                        fNode.set("parameters", emptySchema);
                    }
                } catch (Exception e) {
                    logger.warn("Invalid JSON schema for tool {}", td.getId(), e);
                }
                toolsArray.add(tNode);
            }
        }

        HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);

        try {
            String targetUrl = endpoint.endsWith("/") ? endpoint + "chat/completions" : endpoint + "/chat/completions";
            ResponseEntity<String> response = restTemplate.postForEntity(targetUrl, entity, String.class);
            return parseResponse(response.getBody());
        } catch (HttpClientErrorException.TooManyRequests e) {
            throw new RateLimitException("Rate limit exceeded", 5000);
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            throw new ModelGatewayException("Model API error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new ModelGatewayException("Unexpected error calling Model API", e);
        }
    }

    private ModelResponse parseResponse(String json) throws ModelGatewayException {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode messageNode = root.path("choices").path(0).path("message");
            
            String content = messageNode.path("content").isTextual() ? messageNode.path("content").asText() : null;
            
            List<ToolCallRequest> toolCalls = new ArrayList<>();
            JsonNode toolCallsNode = messageNode.path("tool_calls");
            if (toolCallsNode.isArray()) {
                for (JsonNode tcNode : toolCallsNode) {
                    String id = tcNode.path("id").asText();
                    String name = tcNode.path("function").path("name").asText();
                    String argumentsStr = tcNode.path("function").path("arguments").asText();
                    Map<String, Object> arguments = objectMapper.readValue(argumentsStr, Map.class);
                    toolCalls.add(new ToolCallRequest(id, name, arguments));
                }
            }

            ModelUsage usage = new ModelUsage(0, 0, 0);
            JsonNode usageNode = root.path("usage");
            if (!usageNode.isMissingNode()) {
                usage.setPromptTokens(usageNode.path("prompt_tokens").asInt());
                usage.setCompletionTokens(usageNode.path("completion_tokens").asInt());
                usage.setTotalTokens(usageNode.path("total_tokens").asInt());
            }

            return new ModelResponse(content, toolCalls, usage);
        } catch (Exception e) {
            throw new ModelGatewayException("Failed to parse model response", e);
        }
    }
}

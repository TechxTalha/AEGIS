package com.aegis.core.model.gateway.service;

import com.aegis.core.model.gateway.dto.ModelRequest;
import com.aegis.core.model.gateway.dto.ModelResponse;
import com.aegis.core.model.gateway.exception.ModelGatewayException;
import com.aegis.core.model.gateway.exception.RateLimitException;
import com.aegis.core.model.gateway.provider.ModelProvider;
import com.aegis.core.model.gateway.provider.OpenAICompatibleProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ModelGatewayService {
    private static final Logger logger = LoggerFactory.getLogger(ModelGatewayService.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${aegis.model.provider:openai}")
    private String providerType;

    @Value("${aegis.model.endpoint:https://api.openai.com/v1}")
    private String endpoint;

    @Value("${aegis.model.api-key:}")
    private String apiKey;

    @Value("${aegis.model.model-name:gpt-4o}")
    private String modelName;

    private ModelProvider activeProvider;

    public ModelGatewayService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        // Defaulting to OpenAI compatible which is practically universal right now.
        this.activeProvider = new OpenAICompatibleProvider(restTemplate, objectMapper, endpoint, apiKey, modelName);
        logger.info("Initialized Model Gateway with provider: {}", activeProvider.getProviderName());
    }

    @org.springframework.retry.annotation.Retryable(
        retryFor = {ModelGatewayException.class, RateLimitException.class},
        maxAttempts = 3,
        backoff = @org.springframework.retry.annotation.Backoff(delay = 1000, multiplier = 2.0)
    )
    public ModelResponse generate(ModelRequest request) throws ModelGatewayException {
        if (activeProvider == null) {
            throw new ModelGatewayException("No model provider configured");
        }

        try {
            logger.debug("Sending request to model provider: {}", activeProvider.getProviderName());
            ModelResponse response = activeProvider.generate(request);
            logger.debug("Received response from model provider. Prompt Tokens: {}, Completion Tokens: {}", 
                    response.getUsage().getPromptTokens(), response.getUsage().getCompletionTokens());
            return response;
        } catch (RateLimitException e) {
            logger.warn("Rate limit hit on {}. Retry after {}ms", activeProvider.getProviderName(), e.getRetryAfterMs());
            throw e;
        } catch (Exception e) {
            logger.error("Model generation failed", e);
            throw new ModelGatewayException("Model generation failed", e);
        }
    }
}

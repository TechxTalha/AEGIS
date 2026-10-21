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

import java.util.ArrayList;
import java.util.List;

/**
 * ModelGatewayService provides a resilient, multi-tiered AI model gateway.
 *
 * It supports an arbitrary cascade of model providers (e.g. Primary, Fallback-1, Fallback-2, Fallback-3).
 * If a free-tier model encounters a rate limit (HTTP 429) or temporary gateway error,
 * the gateway automatically cascades to the next available fallback provider without client disruption.
 */
@Service
public class ModelGatewayService {
    private static final Logger logger = LoggerFactory.getLogger(ModelGatewayService.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // --- Primary Model Tier ---
    @Value("${aegis.model.primary.endpoint:${aegis.model.endpoint:https://api.openai.com/v1}}")
    private String primaryEndpoint;

    @Value("${aegis.model.primary.api-key:${aegis.model.api-key:}}")
    private String primaryApiKey;

    @Value("${aegis.model.primary.model-name:${aegis.model.model-name:gpt-4o}}")
    private String primaryModelName;

    // --- Fallback Tier 1 (e.g., Groq free tier) ---
    @Value("${aegis.model.fallback1.endpoint:https://api.groq.com/openai/v1}")
    private String fallback1Endpoint;

    @Value("${aegis.model.fallback1.api-key:}")
    private String fallback1ApiKey;

    @Value("${aegis.model.fallback1.model-name:llama-3.3-70b-versatile}")
    private String fallback1ModelName;

    // --- Fallback Tier 2 (e.g., Google Gemini via OpenAI-compatible endpoint) ---
    @Value("${aegis.model.fallback2.endpoint:https://generativelanguage.googleapis.com/v1beta/openai/}")
    private String fallback2Endpoint;

    @Value("${aegis.model.fallback2.api-key:}")
    private String fallback2ApiKey;

    @Value("${aegis.model.fallback2.model-name:gemini-1.5-flash}")
    private String fallback2ModelName;

    // --- Fallback Tier 3 (e.g., OpenRouter / Mistral / Together) ---
    @Value("${aegis.model.fallback3.endpoint:https://openrouter.ai/api/v1}")
    private String fallback3Endpoint;

    @Value("${aegis.model.fallback3.api-key:}")
    private String fallback3ApiKey;

    @Value("${aegis.model.fallback3.model-name:meta-llama/llama-3.1-8b-instruct:free}")
    private String fallback3ModelName;

    private final List<ModelProvider> providerChain = new ArrayList<>();

    public ModelGatewayService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        providerChain.clear();
        addIfConfigured(primaryEndpoint, primaryApiKey, primaryModelName, "Primary");
        addIfConfigured(fallback1Endpoint, fallback1ApiKey, fallback1ModelName, "Fallback-1");
        addIfConfigured(fallback2Endpoint, fallback2ApiKey, fallback2ModelName, "Fallback-2");
        addIfConfigured(fallback3Endpoint, fallback3ApiKey, fallback3ModelName, "Fallback-3");

        if (providerChain.isEmpty()) {
            logger.warn("No AI model provider has an API key configured. Gateway will throw on generate calls.");
        } else {
            logger.info("Initialized Model Gateway with {} active provider(s) in fallback cascade: {}",
                    providerChain.size(),
                    providerChain.stream().map(ModelProvider::getProviderName).toList());
        }
    }

    private void addIfConfigured(String endpoint, String apiKey, String modelName, String tierLabel) {
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            OpenAICompatibleProvider provider = new OpenAICompatibleProvider(
                    restTemplate, objectMapper, endpoint.trim(), apiKey.trim(), modelName.trim()
            );
            providerChain.add(provider);
            logger.info("Registered [{}] model provider: {} (model: {})", tierLabel, endpoint, modelName);
        }
    }

    /**
     * Programmatically registers a provider into the fallback cascade (useful for testing or dynamic plugin models).
     */
    public void registerProvider(ModelProvider provider) {
        if (provider != null) {
            providerChain.add(provider);
        }
    }

    /**
     * Attempts generation across the fallback cascade.
     * Cascades to subsequent providers upon RateLimitException or ModelGatewayException.
     */
    public ModelResponse generate(ModelRequest request) throws ModelGatewayException {
        if (providerChain.isEmpty()) {
            throw new ModelGatewayException("No AI model providers configured with active API keys.");
        }

        List<String> errorTrace = new ArrayList<>();

        for (int i = 0; i < providerChain.size(); i++) {
            ModelProvider provider = providerChain.get(i);
            try {
                logger.debug("Dispatching request to model provider [{}] (tier {} of {})...",
                        provider.getProviderName(), i + 1, providerChain.size());

                ModelResponse response = provider.generate(request);
                logger.debug("Successfully received response from [{}]. Usage: {} prompt, {} completion tokens.",
                        provider.getProviderName(),
                        response.getUsage() != null ? response.getUsage().getPromptTokens() : 0,
                        response.getUsage() != null ? response.getUsage().getCompletionTokens() : 0);
                return response;

            } catch (RateLimitException e) {
                String errorMsg = String.format("Rate limit hit on [%s]: %s", provider.getProviderName(), e.getMessage());
                logger.warn("{} - Cascading to next fallback tier...", errorMsg);
                errorTrace.add(errorMsg);
            } catch (Exception e) {
                String errorMsg = String.format("Provider [%s] failed: %s", provider.getProviderName(), e.getMessage());
                logger.warn("{} - Cascading to next fallback tier...", errorMsg);
                errorTrace.add(errorMsg);
            }
        }

        String summary = "All AI model providers in fallback cascade failed: " + String.join(" -> ", errorTrace);
        logger.error(summary);
        throw new ModelGatewayException(summary);
    }

    public List<ModelProvider> getProviderChain() {
        return List.copyOf(providerChain);
    }
}

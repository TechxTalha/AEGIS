package com.aegis.core.model.gateway.service;

import com.aegis.core.model.gateway.dto.ModelMessage;
import com.aegis.core.model.gateway.dto.ModelRequest;
import com.aegis.core.model.gateway.dto.ModelResponse;
import com.aegis.core.model.gateway.exception.ModelGatewayException;
import com.aegis.core.model.gateway.exception.RateLimitException;
import com.aegis.core.model.gateway.provider.ModelProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ModelGatewayServiceTest {

    private RestTemplate restTemplate;
    private ObjectMapper objectMapper;
    private ModelGatewayService gatewayService;

    @BeforeEach
    void setUp() {
        restTemplate = mock(RestTemplate.class);
        objectMapper = new ObjectMapper();
        gatewayService = new ModelGatewayService(restTemplate, objectMapper);
    }

    @Test
    void testPrimarySucceedsDirectly() throws Exception {
        ModelProvider primary = mock(ModelProvider.class);
        when(primary.getProviderName()).thenReturn("Primary-Groq");

        ModelResponse expectedResponse = new ModelResponse();
        expectedResponse.setContent("Primary response");
        when(primary.generate(any())).thenReturn(expectedResponse);

        gatewayService.registerProvider(primary);

        ModelRequest request = new ModelRequest();
        request.setMessages(List.of(ModelMessage.user("Hello")));

        ModelResponse actual = gatewayService.generate(request);
        assertNotNull(actual);
        assertEquals("Primary response", actual.getContent());
        verify(primary, times(1)).generate(any());
    }

    @Test
    void testCascadesToFallbackWhenPrimaryHitsRateLimit() throws Exception {
        ModelProvider primary = mock(ModelProvider.class);
        when(primary.getProviderName()).thenReturn("Primary-Groq");
        when(primary.generate(any())).thenThrow(new RateLimitException("429 Too Many Requests", 5000));

        ModelProvider fallback = mock(ModelProvider.class);
        when(fallback.getProviderName()).thenReturn("Fallback-Gemini");
        ModelResponse fallbackResponse = new ModelResponse();
        fallbackResponse.setContent("Fallback response");
        when(fallback.generate(any())).thenReturn(fallbackResponse);

        gatewayService.registerProvider(primary);
        gatewayService.registerProvider(fallback);

        ModelRequest request = new ModelRequest();
        request.setMessages(List.of(ModelMessage.user("Hello")));

        ModelResponse actual = gatewayService.generate(request);
        assertNotNull(actual);
        assertEquals("Fallback response", actual.getContent());

        verify(primary, times(1)).generate(any());
        verify(fallback, times(1)).generate(any());
    }

    @Test
    void testThrowsExceptionWhenAllProvidersFail() throws Exception {
        ModelProvider primary = mock(ModelProvider.class);
        when(primary.getProviderName()).thenReturn("Primary");
        when(primary.generate(any())).thenThrow(new RateLimitException("Rate limit hit", 1000));

        ModelProvider fallback = mock(ModelProvider.class);
        when(fallback.getProviderName()).thenReturn("Fallback");
        when(fallback.generate(any())).thenThrow(new ModelGatewayException("500 Internal error"));

        gatewayService.registerProvider(primary);
        gatewayService.registerProvider(fallback);

        ModelRequest request = new ModelRequest();
        request.setMessages(List.of(ModelMessage.user("Hello")));

        assertThrows(ModelGatewayException.class, () -> gatewayService.generate(request));
        verify(primary, times(1)).generate(any());
        verify(fallback, times(1)).generate(any());
    }

    @Test
    void testThrowsWhenNoProvidersConfigured() {
        ModelRequest request = new ModelRequest();
        request.setMessages(List.of(ModelMessage.user("Hello")));

        assertThrows(ModelGatewayException.class, () -> gatewayService.generate(request));
    }
}

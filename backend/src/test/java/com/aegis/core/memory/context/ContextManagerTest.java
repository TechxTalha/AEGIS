package com.aegis.core.memory.context;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

class ContextManagerTest {

    @Test
    void testGenerateSystemContext() {
        ContextProvider mockProvider = new ContextProvider() {
            @Override
            public String getContextName() { return "Mock Context"; }
            @Override
            public String buildContext() { return "Mock data 123"; }
        };

        ContextManager manager = new ContextManager(List.of(mockProvider));

        String basePrompt = "You are an AI assistant.";
        String result = manager.generateSystemContext(basePrompt);

        assertTrue(result.contains("You are an AI assistant."));
        assertTrue(result.contains("### CURRENT SYSTEM CONTEXT ###"));
        assertTrue(result.contains("--- Mock Context ---"));
        assertTrue(result.contains("Mock data 123"));
    }
}

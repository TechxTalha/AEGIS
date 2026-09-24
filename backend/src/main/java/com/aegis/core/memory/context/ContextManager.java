package com.aegis.core.memory.context;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ContextManager {
    private static final Logger logger = LoggerFactory.getLogger(ContextManager.class);

    private final List<ContextProvider> contextProviders;

    public ContextManager(List<ContextProvider> contextProviders) {
        this.contextProviders = contextProviders;
    }

    public String generateSystemContext(String basePrompt) {
        StringBuilder sb = new StringBuilder();
        
        if (basePrompt != null && !basePrompt.trim().isEmpty()) {
            sb.append(basePrompt).append("\n\n");
        }

        sb.append("### CURRENT SYSTEM CONTEXT ###\n\n");

        for (ContextProvider provider : contextProviders) {
            try {
                sb.append("--- ").append(provider.getContextName()).append(" ---\n");
                sb.append(provider.buildContext()).append("\n\n");
            } catch (Exception e) {
                logger.error("Error building context from provider: {}", provider.getContextName(), e);
                sb.append("[Context Unavailable: ").append(e.getMessage()).append("]\n\n");
            }
        }

        return sb.toString();
    }
}

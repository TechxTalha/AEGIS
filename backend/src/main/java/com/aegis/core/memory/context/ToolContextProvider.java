package com.aegis.core.memory.context;

import com.aegis.core.tool.model.ToolDefinition;
import com.aegis.core.tool.registry.ToolRegistry;
import org.springframework.stereotype.Component;

@Component
public class ToolContextProvider implements ContextProvider {

    private final ToolRegistry toolRegistry;

    public ToolContextProvider(ToolRegistry toolRegistry) {
        this.toolRegistry = toolRegistry;
    }

    @Override
    public String getContextName() {
        return "Tool Context";
    }

    @Override
    public String buildContext() {
        StringBuilder sb = new StringBuilder();
        sb.append("The following tools are available in the registry:\n");

        for (ToolDefinition tool : toolRegistry.getAllTools()) {
            sb.append(String.format("- %s: %s (Risk: %s)\n", tool.getId(), tool.getDescription(), tool.getRiskLevel()));
        }

        return sb.toString();
    }
}

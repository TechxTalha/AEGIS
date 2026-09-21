package com.aegis.core.tool.registry;

import com.aegis.core.tool.model.ToolDefinition;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class InMemoryToolRegistry implements ToolRegistry {
    
    private final Map<String, ToolDefinition> tools = new ConcurrentHashMap<>();

    @Override
    public void registerTool(ToolDefinition toolDefinition) {
        if (toolDefinition == null || toolDefinition.getId() == null || toolDefinition.getId().trim().isEmpty()) {
            throw new IllegalArgumentException("ToolDefinition and its ID cannot be null or empty");
        }
        if (toolDefinition.getName() == null || toolDefinition.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tool name is required for tool: " + toolDefinition.getId());
        }
        if (toolDefinition.getRiskLevel() == null) {
            throw new IllegalArgumentException("Risk level must be explicitly defined for tool: " + toolDefinition.getId());
        }
        if (toolDefinition.getStatus() == null) {
            throw new IllegalArgumentException("Tool status must be explicitly defined for tool: " + toolDefinition.getId());
        }
        tools.put(toolDefinition.getId(), toolDefinition);
    }

    @Override
    public Optional<ToolDefinition> getTool(String id) {
        return Optional.ofNullable(tools.get(id));
    }

    @Override
    public List<ToolDefinition> getAllTools() {
        return new ArrayList<>(tools.values());
    }

    @Override
    public List<ToolDefinition> discoverToolsByCapability(String keyword) {
        String lowerKeyword = keyword.toLowerCase();
        return tools.values().stream()
                .filter(tool -> {
                    boolean inName = tool.getName() != null && tool.getName().toLowerCase().contains(lowerKeyword);
                    boolean inDesc = tool.getDescription() != null && tool.getDescription().toLowerCase().contains(lowerKeyword);
                    boolean inMetadata = false;
                    if (tool.getCapabilityMetadata() != null) {
                        inMetadata = tool.getCapabilityMetadata().values().stream()
                                .anyMatch(val -> val.toLowerCase().contains(lowerKeyword));
                    }
                    return inName || inDesc || inMetadata;
                })
                .collect(Collectors.toList());
    }
}

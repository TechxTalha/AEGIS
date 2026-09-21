package com.aegis.core.tool.registry;

import com.aegis.core.tool.model.ToolDefinition;
import java.util.List;
import java.util.Optional;

public interface ToolRegistry {
    void registerTool(ToolDefinition toolDefinition);
    Optional<ToolDefinition> getTool(String id);
    List<ToolDefinition> getAllTools();
    List<ToolDefinition> discoverToolsByCapability(String keyword);
}

package com.aegis.core.tool.executor;

import com.aegis.core.tool.model.ToolDefinition;
import com.aegis.core.tool.model.ToolInvocation;
import com.aegis.core.tool.model.ToolResult;

public interface ToolExecutor {
    ToolDefinition getDefinition();
    ToolResult execute(ToolInvocation request);
}

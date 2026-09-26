package com.aegis.core.tool.executor;

import com.aegis.core.tool.model.ToolDefinition;
import com.aegis.core.tool.model.ToolInvocation;
import com.aegis.core.tool.model.ToolResult;
import com.aegis.core.tool.registry.ToolRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ToolExecutionEngine {

    private final ToolRegistry toolRegistry;
    private final Map<String, ToolExecutor> executors = new ConcurrentHashMap<>();

    @Autowired
    public ToolExecutionEngine(ToolRegistry toolRegistry, List<ToolExecutor> availableExecutors) {
        this.toolRegistry = toolRegistry;
        // Automatically register all discovered executors and their definitions
        if (availableExecutors != null) {
            for (ToolExecutor executor : availableExecutors) {
                ToolDefinition def = executor.getDefinition();
                if (def != null && def.getId() != null) {
                    toolRegistry.registerTool(def);
                    executors.put(def.getId(), executor);
                }
            }
        }
    }

    public void registerDynamicExecutor(String toolId, ToolExecutor executor) {
        executors.put(toolId, executor);
    }

    public ToolResult execute(ToolInvocation invocation) {
        if (invocation == null || invocation.getToolId() == null) {
            return ToolResult.failure("ToolInvocation or toolId cannot be null", 0);
        }

        String toolId = invocation.getToolId();
        Optional<ToolDefinition> toolDefOpt = toolRegistry.getTool(toolId);

        if (toolDefOpt.isEmpty()) {
            return ToolResult.failure("Tool not found in registry: " + toolId, 0);
        }

        ToolDefinition toolDef = toolDefOpt.get();
        if (toolDef.getStatus() == com.aegis.core.tool.model.ToolStatus.INACTIVE) {
            return ToolResult.failure("Tool is currently INACTIVE: " + toolId, 0);
        }

        ToolExecutor executor = executors.get(toolId);
        if (executor == null) {
            return ToolResult.failure("No executor available for tool: " + toolId, 0);
        }

        // In the future: Add input schema validation, permission checks, and risk level approvals here.

        long startTime = System.currentTimeMillis();
        try {
            long timeoutMs = 60000L;
            if (toolDef.getExecutionConstraints() != null && toolDef.getExecutionConstraints().getTimeoutMs() != null) {
                timeoutMs = toolDef.getExecutionConstraints().getTimeoutMs();
            }

            // Wrap execution in a CompletableFuture with a strict timeout
            java.util.concurrent.CompletableFuture<ToolResult> future = java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                try {
                    return executor.execute(invocation);
                } catch (Exception e) {
                    throw new java.util.concurrent.CompletionException(e);
                }
            });

            ToolResult result = future.get(timeoutMs, java.util.concurrent.TimeUnit.MILLISECONDS);
            
            if (result.getExecutionTimeMs() == 0) {
                result.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            }
            return result;
        } catch (java.util.concurrent.TimeoutException e) {
            return ToolResult.failure("Tool execution timed out", System.currentTimeMillis() - startTime);
        } catch (Exception e) {
            return ToolResult.failure("Tool execution failed with exception: " + e.getMessage(), System.currentTimeMillis() - startTime);
        }
    }
}

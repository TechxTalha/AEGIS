package com.aegis.core.agent.server;

import com.aegis.core.agent.dto.AgentRegisterRequest;
import com.aegis.core.tool.model.ExecutionConstraints;
import com.aegis.core.tool.model.RiskLevel;
import com.aegis.core.tool.model.ToolDefinition;
import com.aegis.core.tool.model.ToolStatus;
import com.aegis.core.tool.registry.ToolRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.aegis.core.tool.executor.ToolExecutionEngine;
import com.aegis.core.tool.executor.ToolExecutor;
import com.aegis.core.tool.model.ToolInvocation;
import com.aegis.core.tool.model.ToolResult;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class AgentManager {
    private static final Logger logger = LoggerFactory.getLogger(AgentManager.class);

    private final ToolRegistry toolRegistry;
    private final ToolExecutionEngine toolExecutionEngine;
    private final SimpMessagingTemplate messagingTemplate;
    
    private final Map<String, AgentInfo> connectedAgents = new ConcurrentHashMap<>();
    private final Map<String, CompletableFuture<ToolResult>> pendingTasks = new ConcurrentHashMap<>();

    public AgentManager(ToolRegistry toolRegistry, ToolExecutionEngine toolExecutionEngine, SimpMessagingTemplate messagingTemplate) {
        this.toolRegistry = toolRegistry;
        this.toolExecutionEngine = toolExecutionEngine;
        this.messagingTemplate = messagingTemplate;
    }

    public void registerAgent(String agentId, AgentRegisterRequest request) {
        logger.info("Registering agent: {} (OS: {}, Hostname: {})", agentId, request.getOs(), request.getHostname());
        
        AgentInfo info = new AgentInfo(agentId, request.getHostname(), request.getOs(), request.getCapabilities());
        info.setLastHeartbeat(System.currentTimeMillis());
        connectedAgents.put(agentId, info);

        // Register the tool capability for this agent
        ToolDefinition sysExecute = new ToolDefinition();
        sysExecute.setId("sys.execute." + agentId);
        sysExecute.setName("System Execute on " + request.getHostname());
        sysExecute.setDescription("Execute a terminal command on the agent host");
        sysExecute.setInputSchema("{ \"type\": \"object\", \"properties\": { \"command\": { \"type\": \"string\" }, \"args\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } } }, \"required\": [\"command\"] }");
        sysExecute.setOutputSchema("{ \"type\": \"object\", \"properties\": { \"stdout\": { \"type\": \"string\" }, \"stderr\": { \"type\": \"string\" }, \"exitCode\": { \"type\": \"integer\" } } }");
        sysExecute.setRiskLevel(RiskLevel.HIGH);
        sysExecute.setStatus(ToolStatus.ACTIVE);
        sysExecute.setExecutionConstraints(new ExecutionConstraints(30000L, 0, false));
        
        toolRegistry.registerTool(sysExecute);
        
        // Register a dynamic executor that proxies the invocation to the agent over STOMP
        toolExecutionEngine.registerDynamicExecutor(sysExecute.getId(), new ToolExecutor() {
            @Override
            public ToolDefinition getDefinition() {
                return sysExecute;
            }

            @Override
            public ToolResult execute(ToolInvocation invocation) {
                CompletableFuture<ToolResult> future = new CompletableFuture<>();
                pendingTasks.put(invocation.getTaskId(), future);
                
                // Send to the agent's private queue
                messagingTemplate.convertAndSendToUser(agentId, "/queue/agent/execute", invocation);
                
                try {
                    // Block and wait for result up to constraint timeout + buffer
                    return future.get(35000L, TimeUnit.MILLISECONDS);
                } catch (Exception e) {
                    pendingTasks.remove(invocation.getTaskId());
                    return ToolResult.failure("Agent execution timed out or failed: " + e.getMessage(), 500);
                }
            }
        });
    }

    public void completeTask(String taskId, com.aegis.core.agent.dto.AgentResult agentResult) {
        CompletableFuture<ToolResult> future = pendingTasks.remove(taskId);
        if (future != null) {
            ToolResult result = new ToolResult();
            result.setSuccess(agentResult.isSuccess());
            result.setErrorMessage(agentResult.getErrorMessage());
            
            // Pack stdout/stderr and exitCode into output data
            java.util.Map<String, Object> output = new java.util.HashMap<>();
            output.put("stdout", agentResult.getStdout());
            output.put("stderr", agentResult.getStderr());
            output.put("exitCode", agentResult.getExitCode());
            try {
                result.setPayload(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(output));
            } catch (Exception e) {
                result.setPayload("Error serializing output");
            }
            
            future.complete(result);
        } else {
            logger.warn("Received result for unknown or timed out task: {}", taskId);
        }
    }

    public void updateHeartbeat(String agentId) {
        AgentInfo info = connectedAgents.get(agentId);
        if (info != null) {
            info.setLastHeartbeat(System.currentTimeMillis());
        } else {
            logger.warn("Heartbeat received for unknown agent: {}", agentId);
        }
    }

    public void unregisterAgent(String agentId) {
        logger.info("Unregistering agent: {}", agentId);
        connectedAgents.remove(agentId);
        // We might want to mark the tool as INACTIVE in ToolRegistry here
    }
}

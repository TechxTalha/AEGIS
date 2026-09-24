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

        // Register the sys.execute capability
        registerAgentTool(agentId, "sys.execute", "System Execute on " + request.getHostname(), 
            "Execute a terminal command on the agent host",
            "{ \"type\": \"object\", \"properties\": { \"command\": { \"type\": \"string\" }, \"args\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } } }, \"required\": [\"command\"] }",
            "{ \"type\": \"object\", \"properties\": { \"stdout\": { \"type\": \"string\" }, \"stderr\": { \"type\": \"string\" }, \"exitCode\": { \"type\": \"integer\" } } }",
            RiskLevel.HIGH);

        String commonOutSchema = "{ \"type\": \"object\", \"properties\": { \"stdout\": { \"type\": \"string\" }, \"stderr\": { \"type\": \"string\" }, \"exitCode\": { \"type\": \"integer\" } } }";

        java.util.List<String> capabilities = request.getCapabilities();
        if (capabilities == null) {
            capabilities = new java.util.ArrayList<>();
        }

        // Register System Info capabilities if supported
        if (capabilities.contains("sys.info")) {
            registerAgentTool(agentId, "sys.info.memory", "Memory Info on " + request.getHostname(), "Get system memory statistics JSON string in stdout", "{}", commonOutSchema, RiskLevel.LOW);
            registerAgentTool(agentId, "sys.info.cpu", "CPU Info on " + request.getHostname(), "Get system CPU statistics JSON string in stdout", "{}", commonOutSchema, RiskLevel.LOW);
            registerAgentTool(agentId, "sys.info.processes", "Process List on " + request.getHostname(), "Get top running processes JSON array string in stdout", "{}", commonOutSchema, RiskLevel.LOW);
            registerAgentTool(agentId, "sys.info.disk", "Disk Info on " + request.getHostname(), "Get system disk statistics JSON array string in stdout", "{}", commonOutSchema, RiskLevel.LOW);
            registerAgentTool(agentId, "sys.info.network", "Network Info on " + request.getHostname(), "Get system network statistics JSON array string in stdout", "{}", commonOutSchema, RiskLevel.LOW);
            registerAgentTool(agentId, "sys.info.services", "Services Info on " + request.getHostname(), "Get system services state JSON array string in stdout", "{}", commonOutSchema, RiskLevel.LOW);
        }

        if (capabilities.contains("sys.logs")) {
            registerAgentTool(agentId, "sys.logs.read", "Read Logs on " + request.getHostname(), 
                "Read tail lines from a system log file into stdout", 
                "{ \"type\": \"object\", \"properties\": { \"path\": { \"type\": \"string\" }, \"lines\": { \"type\": \"integer\" } }, \"required\": [\"path\"] }", 
                commonOutSchema, 
                RiskLevel.MEDIUM);
        }

        if (capabilities.contains("sys.fs")) {
            registerAgentTool(agentId, "sys.fs.read", "Read File on " + request.getHostname(), 
                "Read content of a file into stdout", 
                "{ \"type\": \"object\", \"properties\": { \"path\": { \"type\": \"string\" } }, \"required\": [\"path\"] }", 
                commonOutSchema, RiskLevel.LOW);
            registerAgentTool(agentId, "sys.fs.write", "Write File on " + request.getHostname(), 
                "Write content to a file", 
                "{ \"type\": \"object\", \"properties\": { \"path\": { \"type\": \"string\" }, \"content\": { \"type\": \"string\" } }, \"required\": [\"path\", \"content\"] }", 
                commonOutSchema, RiskLevel.HIGH);
            registerAgentTool(agentId, "sys.fs.list", "List Directory on " + request.getHostname(), 
                "List contents of a directory in stdout", 
                "{ \"type\": \"object\", \"properties\": { \"path\": { \"type\": \"string\" } }, \"required\": [\"path\"] }", 
                commonOutSchema, RiskLevel.LOW);
        }
    }

    private void registerAgentTool(String agentId, String baseToolId, String name, String description, String inSchema, String outSchema, RiskLevel riskLevel) {
        ToolDefinition tool = new ToolDefinition();
        tool.setId(baseToolId + "." + agentId);
        tool.setName(name);
        tool.setDescription(description);
        tool.setInputSchema(inSchema);
        tool.setOutputSchema(outSchema);
        tool.setRiskLevel(riskLevel);
        tool.setStatus(ToolStatus.ACTIVE);
        tool.setExecutionConstraints(new ExecutionConstraints(30000L, 0, false));
        
        toolRegistry.registerTool(tool);
        
        toolExecutionEngine.registerDynamicExecutor(tool.getId(), new ToolExecutor() {
            @Override
            public ToolDefinition getDefinition() { return tool; }
            @Override
            public ToolResult execute(ToolInvocation invocation) {
                CompletableFuture<ToolResult> future = new CompletableFuture<>();
                pendingTasks.put(invocation.getTaskId(), future);
                messagingTemplate.convertAndSendToUser(agentId, "/queue/agent/execute", invocation);
                try {
                    return future.get(35000L, TimeUnit.MILLISECONDS);
                } catch (Exception e) {
                    pendingTasks.remove(invocation.getTaskId());
                    return ToolResult.failure("Agent execution timed out: " + e.getMessage(), 500);
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
        
        for (com.aegis.core.tool.model.ToolDefinition tool : toolRegistry.getAllTools()) {
            if (tool.getId().endsWith("." + agentId)) {
                tool.setStatus(com.aegis.core.tool.model.ToolStatus.INACTIVE);
            }
        }
    }
}

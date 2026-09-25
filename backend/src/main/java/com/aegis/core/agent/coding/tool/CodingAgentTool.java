package com.aegis.core.agent.coding.tool;

import com.aegis.core.agent.orchestration.model.AgentJobRequest;
import com.aegis.core.agent.orchestration.model.AgentJobResult;
import com.aegis.core.agent.orchestration.model.AgentJobStatus;
import com.aegis.core.agent.orchestration.service.SpecializedAgentProtocol;
import com.aegis.core.tool.executor.ToolExecutor;
import com.aegis.core.tool.model.RiskLevel;
import com.aegis.core.tool.model.ToolDefinition;
import com.aegis.core.tool.model.ToolInvocation;
import com.aegis.core.tool.model.ToolResult;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class CodingAgentTool implements ToolExecutor {

    public static final String TOOL_ID = "agentic-ide-delegate";
    
    private final SpecializedAgentProtocol codingAgentProtocol;

    public CodingAgentTool(@org.springframework.beans.factory.annotation.Qualifier("antigravityAgentAdapter") SpecializedAgentProtocol codingAgentProtocol) {
        this.codingAgentProtocol = codingAgentProtocol;
    }

    @Override
    public ToolDefinition getDefinition() {
        ToolDefinition definition = new ToolDefinition();
        definition.setId(TOOL_ID);
        definition.setName("Google Antigravity IDE Agent");
        definition.setDescription("Delegates a complex coding objective to the external agentic IDE. Use this when source code modifications are required.");
        definition.setRiskLevel(RiskLevel.HIGH);
        definition.setRequiredPermissions(java.util.List.of("aegis.coding.delegate"));
        
        definition.setInputSchema("{\"type\": \"object\", \"properties\": {\"objective\": {\"type\": \"string\", \"description\": \"The detailed coding objective\"}, \"repositoryPath\": {\"type\": \"string\", \"description\": \"The path to the source code repository\"}}, \"required\": [\"objective\", \"repositoryPath\"]}");

        return definition;
    }

    @Override
    public ToolResult execute(ToolInvocation invocation) {
        ToolResult result = new ToolResult();
        try {
            Map<String, Object> params = invocation.getParameters();
            String objective = (String) params.get("objective");
            String repositoryPath = (String) params.get("repositoryPath");

            AgentJobRequest request = new AgentJobRequest(java.util.UUID.randomUUID().toString(), objective, Map.of("repositoryPath", repositoryPath));
            String jobId = codingAgentProtocol.submitJob(request);

            // Synchronously wait for completion in this thread for simplicity (up to a timeout)
            int maxWaitSeconds = 300;
            int waited = 0;
            while (waited < maxWaitSeconds) {
                AgentJobStatus status = codingAgentProtocol.getJobStatus(jobId);
                if (status == AgentJobStatus.COMPLETED) {
                    AgentJobResult jobResult = codingAgentProtocol.getJobResult(jobId);
                    result.setSuccess(true);
                    java.util.List<String> changedFiles = (java.util.List<String>) jobResult.getPayload().get("changedFiles");
                    result.setPayload(jobResult.getMessage() + "\nFiles changed: " + String.join(", ", changedFiles));
                    return result;
                } else if (status == AgentJobStatus.FAILED || status == AgentJobStatus.CANCELLED) {
                    result.setSuccess(false);
                    result.setErrorMessage("Coding job " + status);
                    return result;
                }
                Thread.sleep(1000);
                waited++;
            }
            
            codingAgentProtocol.cancelJob(jobId);
            result.setSuccess(false);
            result.setErrorMessage("Coding job timed out");
            return result;

        } catch (Exception e) {
            result.setSuccess(false);
            result.setErrorMessage("Failed to delegate to IDE: " + e.getMessage());
            return result;
        }
    }
}

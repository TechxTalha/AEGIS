package com.aegis.core.agent.orchestration.tools;

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
import org.springframework.beans.factory.annotation.Qualifier;

import java.util.Map;

@Component
public class InfrastructureAgentTool implements ToolExecutor {

    public static final String TOOL_ID = "agentic-infrastructure-delegate";
    private final SpecializedAgentProtocol agentProtocol;

    public InfrastructureAgentTool(@Qualifier("infrastructureAgentAdapter") SpecializedAgentProtocol agentProtocol) {
        this.agentProtocol = agentProtocol;
    }

    @Override
    public ToolDefinition getDefinition() {
        ToolDefinition definition = new ToolDefinition();
        definition.setId(TOOL_ID);
        definition.setName("Infrastructure Agent");
        definition.setDescription("Delegates complex server configuration and deployment tasks to the specialized infrastructure agent.");
        definition.setRiskLevel(RiskLevel.HIGH);
        definition.setRequiredPermissions(java.util.List.of("aegis.infrastructure.delegate"));
        
        definition.setInputSchema("{\"type\": \"object\", \"properties\": {\"objective\": {\"type\": \"string\", \"description\": \"The detailed infrastructure objective\"}}, \"required\": [\"objective\"]}");

        return definition;
    }

    @Override
    public ToolResult execute(ToolInvocation invocation) {
        ToolResult result = new ToolResult();
        try {
            Map<String, Object> params = invocation.getParameters();
            String objective = (String) params.get("objective");

            AgentJobRequest request = new AgentJobRequest(java.util.UUID.randomUUID().toString(), objective, Map.of());
            String jobId = agentProtocol.submitJob(request);

            int maxWaitSeconds = 300;
            int waited = 0;
            while (waited < maxWaitSeconds) {
                AgentJobStatus status = agentProtocol.getJobStatus(jobId);
                if (status == AgentJobStatus.COMPLETED) {
                    AgentJobResult jobResult = agentProtocol.getJobResult(jobId);
                    result.setSuccess(true);
                    result.setPayload(jobResult.getMessage() + "\nServices Restarted: " + jobResult.getPayload().get("servicesRestarted"));
                    return result;
                } else if (status == AgentJobStatus.FAILED || status == AgentJobStatus.CANCELLED) {
                    result.setSuccess(false);
                    result.setErrorMessage("Infrastructure job " + status);
                    return result;
                }
                Thread.sleep(1000);
                waited++;
            }
            
            agentProtocol.cancelJob(jobId);
            result.setSuccess(false);
            result.setErrorMessage("Infrastructure job timed out");
            return result;

        } catch (Exception e) {
            result.setSuccess(false);
            result.setErrorMessage("Failed to delegate to infrastructure agent: " + e.getMessage());
            return result;
        }
    }
}

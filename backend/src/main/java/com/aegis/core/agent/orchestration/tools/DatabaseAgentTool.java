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
public class DatabaseAgentTool implements ToolExecutor {

    public static final String TOOL_ID = "agentic-database-delegate";
    private final SpecializedAgentProtocol agentProtocol;

    public DatabaseAgentTool(@Qualifier("databaseAgentAdapter") SpecializedAgentProtocol agentProtocol) {
        this.agentProtocol = agentProtocol;
    }

    @Override
    public ToolDefinition getDefinition() {
        ToolDefinition definition = new ToolDefinition();
        definition.setId(TOOL_ID);
        definition.setName("Database Agent");
        definition.setDescription("Delegates complex database querying and schema manipulation to the specialized database agent.");
        definition.setRiskLevel(RiskLevel.HIGH);
        definition.setRequiredPermissions(java.util.List.of("aegis.database.delegate"));
        
        definition.setInputSchema("{\"type\": \"object\", \"properties\": {\"objective\": {\"type\": \"string\", \"description\": \"The detailed database objective\"}}, \"required\": [\"objective\"]}");

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
                    result.setPayload(jobResult.getMessage() + "\nRows Affected: " + jobResult.getPayload().get("rowsAffected"));
                    return result;
                } else if (status == AgentJobStatus.FAILED || status == AgentJobStatus.CANCELLED) {
                    result.setSuccess(false);
                    result.setErrorMessage("Database job " + status);
                    return result;
                }
                Thread.sleep(1000);
                waited++;
            }
            
            agentProtocol.cancelJob(jobId);
            result.setSuccess(false);
            result.setErrorMessage("Database job timed out");
            return result;

        } catch (Exception e) {
            result.setSuccess(false);
            result.setErrorMessage("Failed to delegate to database agent: " + e.getMessage());
            return result;
        }
    }
}

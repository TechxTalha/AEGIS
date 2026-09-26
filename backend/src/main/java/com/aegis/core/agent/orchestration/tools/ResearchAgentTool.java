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
public class ResearchAgentTool implements ToolExecutor {

    public static final String TOOL_ID = "agentic-research-delegate";
    private final SpecializedAgentProtocol agentProtocol;
    private final com.aegis.core.security.LLMSecurityFilter securityFilter;

    public ResearchAgentTool(@Qualifier("researchAgentAdapter") SpecializedAgentProtocol agentProtocol,
                             com.aegis.core.security.LLMSecurityFilter securityFilter) {
        this.agentProtocol = agentProtocol;
        this.securityFilter = securityFilter;
    }

    @Override
    public ToolDefinition getDefinition() {
        ToolDefinition definition = new ToolDefinition();
        definition.setId(TOOL_ID);
        definition.setName("Research Agent");
        definition.setDescription("Delegates research and summarization tasks to the specialized research agent.");
        definition.setRiskLevel(RiskLevel.LOW);
        
        definition.setInputSchema("{\"type\": \"object\", \"properties\": {\"objective\": {\"type\": \"string\", \"description\": \"The detailed research objective\"}}, \"required\": [\"objective\"]}");

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
                    String rawPayload = jobResult.getMessage() + "\nSummary: " + jobResult.getPayload().get("summary");
                    result.setPayload(securityFilter.sanitizeInput(rawPayload));
                    return result;
                } else if (status == AgentJobStatus.FAILED || status == AgentJobStatus.CANCELLED) {
                    result.setSuccess(false);
                    result.setErrorMessage("Research job " + status);
                    return result;
                }
                Thread.sleep(1000);
                waited++;
            }
            
            agentProtocol.cancelJob(jobId);
            result.setSuccess(false);
            result.setErrorMessage("Research job timed out");
            return result;

        } catch (Exception e) {
            result.setSuccess(false);
            result.setErrorMessage("Failed to delegate to research agent: " + e.getMessage());
            return result;
        }
    }
}

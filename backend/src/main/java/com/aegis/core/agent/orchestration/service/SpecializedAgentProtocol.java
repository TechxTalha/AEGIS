package com.aegis.core.agent.orchestration.service;

import com.aegis.core.agent.orchestration.model.AgentJobRequest;
import com.aegis.core.agent.orchestration.model.AgentJobStatus;
import com.aegis.core.agent.orchestration.model.AgentJobResult;

public interface SpecializedAgentProtocol {
    String submitJob(AgentJobRequest request) throws Exception;
    AgentJobStatus getJobStatus(String jobId) throws Exception;
    AgentJobResult getJobResult(String jobId) throws Exception;
    void cancelJob(String jobId) throws Exception;
}

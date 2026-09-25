package com.aegis.core.agent.coding.service;

import com.aegis.core.agent.coding.model.CodingJobRequest;
import com.aegis.core.agent.coding.model.CodingJobStatus;
import com.aegis.core.agent.coding.model.CodingJobResult;

public interface CodingAgentProtocol {
    String submitJob(CodingJobRequest request) throws Exception;
    CodingJobStatus getJobStatus(String jobId) throws Exception;
    CodingJobResult getJobResult(String jobId) throws Exception;
    void cancelJob(String jobId) throws Exception;
}

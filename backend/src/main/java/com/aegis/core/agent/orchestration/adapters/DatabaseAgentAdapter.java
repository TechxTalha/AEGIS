package com.aegis.core.agent.orchestration.adapters;

import com.aegis.core.agent.orchestration.model.AgentJobRequest;
import com.aegis.core.agent.orchestration.model.AgentJobStatus;
import com.aegis.core.agent.orchestration.model.AgentJobResult;
import com.aegis.core.agent.orchestration.service.SpecializedAgentProtocol;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Service
public class DatabaseAgentAdapter implements SpecializedAgentProtocol {
    private static final Logger logger = LoggerFactory.getLogger(DatabaseAgentAdapter.class);
    
    private final Map<String, AgentJobStatus> jobStatuses = new ConcurrentHashMap<>();
    private final Map<String, AgentJobResult> jobResults = new ConcurrentHashMap<>();

    @Override
    public String submitJob(AgentJobRequest request) {
        String jobId = request.getJobId() != null ? request.getJobId() : java.util.UUID.randomUUID().toString();
        logger.info("Submitting database job {}. Objective: {}", jobId, request.getObjective());
        
        jobStatuses.put(jobId, AgentJobStatus.IN_PROGRESS);
        simulateAgentWork(jobId);
        
        return jobId;
    }

    @Override
    public AgentJobStatus getJobStatus(String jobId) {
        return jobStatuses.getOrDefault(jobId, AgentJobStatus.FAILED);
    }

    @Override
    public AgentJobResult getJobResult(String jobId) {
        return jobResults.get(jobId);
    }

    @Override
    public void cancelJob(String jobId) {
        logger.info("Canceling database job {}", jobId);
        if (jobStatuses.containsKey(jobId)) {
            jobStatuses.put(jobId, AgentJobStatus.CANCELLED);
        }
    }

    private void simulateAgentWork(String jobId) {
        new Thread(() -> {
            try {
                Thread.sleep(1500);
                AgentJobResult result = new AgentJobResult();
                result.setJobId(jobId);
                result.setSuccess(true);
                result.setMessage("Database query completed");
                result.setPayload(Map.of("rowsAffected", 0));
                
                jobResults.put(jobId, result);
                jobStatuses.put(jobId, AgentJobStatus.COMPLETED);
                logger.info("Database Job {} completed", jobId);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                jobStatuses.put(jobId, AgentJobStatus.FAILED);
            }
        }).start();
    }
}

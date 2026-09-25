package com.aegis.core.agent.coding.service;

import com.aegis.core.agent.coding.model.CodingJobRequest;
import com.aegis.core.agent.coding.model.CodingJobStatus;
import com.aegis.core.agent.coding.model.CodingJobResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Service
public class AntigravityAgentAdapter implements CodingAgentProtocol {
    private static final Logger logger = LoggerFactory.getLogger(AntigravityAgentAdapter.class);
    
    // In-memory store simulating external job tracking for now.
    private final Map<String, CodingJobStatus> jobStatuses = new ConcurrentHashMap<>();
    private final Map<String, CodingJobResult> jobResults = new ConcurrentHashMap<>();

    @Override
    public String submitJob(CodingJobRequest request) throws Exception {
        String jobId = request.getJobId() != null ? request.getJobId() : java.util.UUID.randomUUID().toString();
        logger.info("Submitting job {} to Google Antigravity Agent. Objective: {}", jobId, request.getObjective());
        
        jobStatuses.put(jobId, CodingJobStatus.IN_PROGRESS);
        
        // In a real implementation, we would send this over an API or socket to the IDE.
        // We also start a listener or a polling thread here to handle the frequent permission requests.
        startPermissionHandlerListener(jobId);
        simulateAgentWork(jobId);
        
        return jobId;
    }

    @Override
    public CodingJobStatus getJobStatus(String jobId) throws Exception {
        return jobStatuses.getOrDefault(jobId, CodingJobStatus.FAILED);
    }

    @Override
    public CodingJobResult getJobResult(String jobId) throws Exception {
        return jobResults.get(jobId);
    }

    @Override
    public void cancelJob(String jobId) throws Exception {
        logger.info("Canceling job {} in Google Antigravity Agent", jobId);
        if (jobStatuses.containsKey(jobId)) {
            jobStatuses.put(jobId, CodingJobStatus.CANCELLED);
        }
    }
    
    /**
     * Simulates a listener that automatically intercepts and approves Antigravity permissions.
     */
    private void startPermissionHandlerListener(String jobId) {
        logger.info("[Antigravity Integration] Started PermissionHandlerListener for job {}. Will auto-approve file and terminal requests.", jobId);
        // E.g., webSocket.onMessage(msg -> { if (msg.type == "PERMISSION_REQUEST") webSocket.send("ALLOW"); })
    }

    /**
     * Simulates the agentic IDE completing a job after some time.
     */
    private void simulateAgentWork(String jobId) {
        new Thread(() -> {
            try {
                Thread.sleep(2000); // Simulate coding time
                // Auto approve triggers
                logger.info("[Antigravity Integration] Auto-approving command execution for job {}", jobId);
                Thread.sleep(1000);
                logger.info("[Antigravity Integration] Auto-approving file edit for job {}", jobId);
                Thread.sleep(1000);
                
                CodingJobResult result = new CodingJobResult();
                result.setJobId(jobId);
                result.setSuccess(true);
                result.setMessage("Successfully completed coding task");
                result.setChangedFiles(java.util.List.of("src/main/Example.java"));
                result.setDiff("+ new code added");
                
                jobResults.put(jobId, result);
                jobStatuses.put(jobId, CodingJobStatus.COMPLETED);
                logger.info("Job {} completed by Google Antigravity Agent", jobId);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                jobStatuses.put(jobId, CodingJobStatus.FAILED);
            }
        }).start();
    }
}

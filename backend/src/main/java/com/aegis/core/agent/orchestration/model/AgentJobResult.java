package com.aegis.core.agent.orchestration.model;

import java.util.Map;

public class AgentJobResult {
    private String jobId;
    private boolean success;
    private String message;
    private Map<String, Object> payload;

    public AgentJobResult() {}

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Map<String, Object> getPayload() { return payload; }
    public void setPayload(Map<String, Object> payload) { this.payload = payload; }
}

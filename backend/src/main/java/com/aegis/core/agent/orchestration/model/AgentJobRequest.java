package com.aegis.core.agent.orchestration.model;

import java.util.Map;

public class AgentJobRequest {
    private String jobId;
    private String objective;
    private String context;
    private Map<String, Object> parameters;

    public AgentJobRequest() {}

    public AgentJobRequest(String jobId, String objective, Map<String, Object> parameters) {
        this.jobId = jobId;
        this.objective = objective;
        this.parameters = parameters;
    }

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }
    public String getObjective() { return objective; }
    public void setObjective(String objective) { this.objective = objective; }
    public String getContext() { return context; }
    public void setContext(String context) { this.context = context; }
    public Map<String, Object> getParameters() { return parameters; }
    public void setParameters(Map<String, Object> parameters) { this.parameters = parameters; }
}

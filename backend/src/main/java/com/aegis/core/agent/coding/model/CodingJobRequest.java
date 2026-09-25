package com.aegis.core.agent.coding.model;

public class CodingJobRequest {
    private String jobId;
    private String objective;
    private String repositoryPath;
    private String context;
    private String constraints;

    public CodingJobRequest() {}

    public CodingJobRequest(String jobId, String objective, String repositoryPath) {
        this.jobId = jobId;
        this.objective = objective;
        this.repositoryPath = repositoryPath;
    }

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }
    public String getObjective() { return objective; }
    public void setObjective(String objective) { this.objective = objective; }
    public String getRepositoryPath() { return repositoryPath; }
    public void setRepositoryPath(String repositoryPath) { this.repositoryPath = repositoryPath; }
    public String getContext() { return context; }
    public void setContext(String context) { this.context = context; }
    public String getConstraints() { return constraints; }
    public void setConstraints(String constraints) { this.constraints = constraints; }
}

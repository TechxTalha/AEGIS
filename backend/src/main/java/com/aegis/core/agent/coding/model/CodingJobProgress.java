package com.aegis.core.agent.coding.model;

public class CodingJobProgress {
    private String jobId;
    private String message;
    private int percentComplete;

    public CodingJobProgress() {}

    public CodingJobProgress(String jobId, String message, int percentComplete) {
        this.jobId = jobId;
        this.message = message;
        this.percentComplete = percentComplete;
    }

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public int getPercentComplete() { return percentComplete; }
    public void setPercentComplete(int percentComplete) { this.percentComplete = percentComplete; }
}

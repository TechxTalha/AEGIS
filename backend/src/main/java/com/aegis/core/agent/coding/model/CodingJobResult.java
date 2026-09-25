package com.aegis.core.agent.coding.model;

import java.util.List;

public class CodingJobResult {
    private String jobId;
    private boolean success;
    private String message;
    private String diff;
    private List<String> changedFiles;

    public CodingJobResult() {}

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getDiff() { return diff; }
    public void setDiff(String diff) { this.diff = diff; }
    public List<String> getChangedFiles() { return changedFiles; }
    public void setChangedFiles(List<String> changedFiles) { this.changedFiles = changedFiles; }
}

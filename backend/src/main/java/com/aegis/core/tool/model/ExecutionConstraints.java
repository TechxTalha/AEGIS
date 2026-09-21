package com.aegis.core.tool.model;

public class ExecutionConstraints {
    private Long timeoutMs;
    private Integer maxRetries;
    private Boolean requiresApproval;

    public ExecutionConstraints() {}

    public ExecutionConstraints(Long timeoutMs, Integer maxRetries, Boolean requiresApproval) {
        this.timeoutMs = timeoutMs;
        this.maxRetries = maxRetries;
        this.requiresApproval = requiresApproval;
    }

    public Long getTimeoutMs() {
        return timeoutMs;
    }

    public void setTimeoutMs(Long timeoutMs) {
        this.timeoutMs = timeoutMs;
    }

    public Integer getMaxRetries() {
        return maxRetries;
    }

    public void setMaxRetries(Integer maxRetries) {
        this.maxRetries = maxRetries;
    }

    public Boolean getRequiresApproval() {
        return requiresApproval;
    }

    public void setRequiresApproval(Boolean requiresApproval) {
        this.requiresApproval = requiresApproval;
    }
}

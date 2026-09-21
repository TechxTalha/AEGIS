package com.aegis.core.tool.model;

public class ToolResult {
    private boolean success;
    private String payload;
    private String errorMessage;
    private long executionTimeMs;

    public ToolResult() {}

    public static ToolResult success(String payload, long executionTimeMs) {
        ToolResult result = new ToolResult();
        result.setSuccess(true);
        result.setPayload(payload);
        result.setExecutionTimeMs(executionTimeMs);
        return result;
    }

    public static ToolResult failure(String errorMessage, long executionTimeMs) {
        ToolResult result = new ToolResult();
        result.setSuccess(false);
        result.setErrorMessage(errorMessage);
        result.setExecutionTimeMs(executionTimeMs);
        return result;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public long getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(long executionTimeMs) { this.executionTimeMs = executionTimeMs; }
}

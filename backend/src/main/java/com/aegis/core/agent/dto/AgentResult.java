package com.aegis.core.agent.dto;

public class AgentResult {
    private String taskId;
    private int exitCode;
    private String stdout;
    private String stderr;
    private boolean success;
    private String errorMessage;

    // Getters and Setters
    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }

    public int getExitCode() { return exitCode; }
    public void setExitCode(int exitCode) { this.exitCode = exitCode; }

    public String getStdout() { return stdout; }
    public void setStdout(String stdout) { this.stdout = stdout; }

    public String getStderr() { return stderr; }
    public void setStderr(String stderr) { this.stderr = stderr; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}

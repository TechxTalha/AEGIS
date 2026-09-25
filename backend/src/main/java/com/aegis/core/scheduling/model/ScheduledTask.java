package com.aegis.core.scheduling.model;

import java.time.LocalDateTime;

public class ScheduledTask {
    private String taskId;
    private String objective;
    private String cronExpression;
    private LocalDateTime executeAt;
    private String status; // PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
    private int retryCount;

    public ScheduledTask() {}

    public ScheduledTask(String taskId, String objective, String cronExpression, LocalDateTime executeAt) {
        this.taskId = taskId;
        this.objective = objective;
        this.cronExpression = cronExpression;
        this.executeAt = executeAt;
        this.status = "PENDING";
        this.retryCount = 0;
    }

    // Getters and Setters
    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }

    public String getObjective() { return objective; }
    public void setObjective(String objective) { this.objective = objective; }

    public String getCronExpression() { return cronExpression; }
    public void setCronExpression(String cronExpression) { this.cronExpression = cronExpression; }

    public LocalDateTime getExecuteAt() { return executeAt; }
    public void setExecuteAt(LocalDateTime executeAt) { this.executeAt = executeAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getRetryCount() { return retryCount; }
    public void setRetryCount(int retryCount) { this.retryCount = retryCount; }
}

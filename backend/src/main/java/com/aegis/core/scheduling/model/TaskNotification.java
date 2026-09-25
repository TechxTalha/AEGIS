package com.aegis.core.scheduling.model;

import java.time.LocalDateTime;

public class TaskNotification {
    private String notificationId;
    private String taskId;
    private String message;
    private LocalDateTime timestamp;

    public TaskNotification() {}

    public TaskNotification(String notificationId, String taskId, String message, LocalDateTime timestamp) {
        this.notificationId = notificationId;
        this.taskId = taskId;
        this.message = message;
        this.timestamp = timestamp;
    }

    public String getNotificationId() { return notificationId; }
    public void setNotificationId(String notificationId) { this.notificationId = notificationId; }

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}

package com.aegis.core.notification.model;

import java.time.LocalDateTime;

public class AegisNotification {
    private String notificationId;
    private String sourceId;
    private String message;
    private NotificationPriority priority;
    private NotificationCategory category;
    private LocalDateTime timestamp;

    public AegisNotification() {}

    public AegisNotification(String notificationId, String sourceId, String message, NotificationPriority priority, NotificationCategory category, LocalDateTime timestamp) {
        this.notificationId = notificationId;
        this.sourceId = sourceId;
        this.message = message;
        this.priority = priority;
        this.category = category;
        this.timestamp = timestamp;
    }

    public String getNotificationId() { return notificationId; }
    public void setNotificationId(String notificationId) { this.notificationId = notificationId; }

    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public NotificationPriority getPriority() { return priority; }
    public void setPriority(NotificationPriority priority) { this.priority = priority; }

    public NotificationCategory getCategory() { return category; }
    public void setCategory(NotificationCategory category) { this.category = category; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}

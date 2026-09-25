package com.aegis.core.notification;

import com.aegis.core.scheduling.model.TaskNotification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class NotificationService {
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    private final List<TaskNotification> notifications = new ArrayList<>();

    public void notify(String taskId, String message) {
        TaskNotification notification = new TaskNotification(
                java.util.UUID.randomUUID().toString(),
                taskId,
                message,
                LocalDateTime.now()
        );
        notifications.add(notification);
        logger.info("[NOTIFICATION] Task {}: {}", taskId, message);
    }

    public List<TaskNotification> getNotifications() {
        return new ArrayList<>(notifications);
    }
}

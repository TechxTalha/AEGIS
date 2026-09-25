package com.aegis.core.notification;

import com.aegis.core.notification.model.AegisNotification;
import com.aegis.core.notification.model.NotificationCategory;
import com.aegis.core.notification.model.NotificationPreference;
import com.aegis.core.notification.model.NotificationPriority;
import com.aegis.core.notification.sink.NotificationSink;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class NotificationService {
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    private final List<AegisNotification> notifications = new ArrayList<>();
    private final Map<String, NotificationSink> sinks;
    private NotificationPreference preference;

    public NotificationService(List<NotificationSink> sinkList) {
        this.sinks = sinkList.stream().collect(Collectors.toMap(NotificationSink::getSinkId, Function.identity()));
        // Default preference
        this.preference = new NotificationPreference(NotificationPriority.LOW, List.of("console", "slack", "email"));
    }

    public void setPreference(NotificationPreference preference) {
        this.preference = preference;
    }

    // Legacy method
    public void notify(String sourceId, String message) {
        notify(sourceId, message, NotificationPriority.LOW, NotificationCategory.SYSTEM);
    }

    public void notify(String sourceId, String message, NotificationPriority priority, NotificationCategory category) {
        AegisNotification notification = new AegisNotification(
                java.util.UUID.randomUUID().toString(),
                sourceId,
                message,
                priority,
                category,
                LocalDateTime.now()
        );
        
        notifications.add(notification);
        logger.info("Generated notification: {}", message);

        if (notification.getPriority().ordinal() >= preference.getPriorityThreshold().ordinal()) {
            for (String sinkId : preference.getEnabledSinks()) {
                NotificationSink sink = sinks.get(sinkId);
                if (sink != null) {
                    try {
                        sink.send(notification);
                    } catch (Exception e) {
                        logger.error("Failed to send notification via sink {}", sinkId, e);
                    }
                }
            }
        }
    }

    public List<AegisNotification> getNotifications() {
        return new ArrayList<>(notifications);
    }
}

package com.aegis.core.notification.sink;

import com.aegis.core.notification.model.AegisNotification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class EmailNotificationSink implements NotificationSink {
    private static final Logger logger = LoggerFactory.getLogger(EmailNotificationSink.class);

    @Override
    public String getSinkId() {
        return "email";
    }

    @Override
    public void send(AegisNotification notification) {
        logger.info("[MOCK EMAIL] Sending to admin@aegis.local | Priority: {} | Message: {}", notification.getPriority(), notification.getMessage());
    }
}

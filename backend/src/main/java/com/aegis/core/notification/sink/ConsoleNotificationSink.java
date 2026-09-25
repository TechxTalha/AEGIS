package com.aegis.core.notification.sink;

import com.aegis.core.notification.model.AegisNotification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ConsoleNotificationSink implements NotificationSink {
    private static final Logger logger = LoggerFactory.getLogger(ConsoleNotificationSink.class);

    @Override
    public String getSinkId() {
        return "console";
    }

    @Override
    public void send(AegisNotification notification) {
        logger.info("[CONSOLE ALERT] [{}] {}", notification.getPriority(), notification.getMessage());
    }
}

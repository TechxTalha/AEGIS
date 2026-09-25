package com.aegis.core.notification.sink;

import com.aegis.core.notification.model.AegisNotification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class SlackNotificationSink implements NotificationSink {
    private static final Logger logger = LoggerFactory.getLogger(SlackNotificationSink.class);

    @Override
    public String getSinkId() {
        return "slack";
    }

    @Override
    public void send(AegisNotification notification) {
        logger.info("[MOCK SLACK] #aegis-alerts | Priority: {} | Message: {}", notification.getPriority(), notification.getMessage());
    }
}

package com.aegis.core.task.websocket;

import com.aegis.core.task.dto.EventDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class TaskEventPublisher {

    private static final Logger logger = LoggerFactory.getLogger(TaskEventPublisher.class);
    private final SimpMessagingTemplate messagingTemplate;

    public TaskEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishEvent(Long taskId, EventDto event) {
        String destination = "/topic/tasks/" + taskId;
        logger.debug("Publishing event {} to {}", event.getEventType(), destination);
        messagingTemplate.convertAndSend(destination, event);
    }
}

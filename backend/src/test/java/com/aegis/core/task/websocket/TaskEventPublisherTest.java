package com.aegis.core.task.websocket;

import com.aegis.core.task.dto.EventDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class TaskEventPublisherTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private TaskEventPublisher eventPublisher;

    @BeforeEach
    void setUp() {
        eventPublisher = new TaskEventPublisher(messagingTemplate);
    }

    @Test
    void testPublishEvent() {
        EventDto dto = new EventDto();
        dto.setId(10L);
        dto.setEventType("TEST_EVENT");
        dto.setDetails("Details");
        dto.setTimestamp(LocalDateTime.now());

        eventPublisher.publishEvent(1L, dto);

        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/tasks/1"), eq(dto));
    }
}

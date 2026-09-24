package com.aegis.core.memory.history;

import com.aegis.core.model.gateway.dto.ModelMessage;
import com.aegis.core.model.gateway.dto.Role;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ConversationHistoryTest {

    @Test
    void testPruningMaintainsSystemPrompt() {
        ConversationHistory history = new ConversationHistory(3);
        
        history.addMessage(ModelMessage.system("System context"));
        history.addMessage(ModelMessage.user("Msg 1"));
        history.addMessage(ModelMessage.assistant("Reply 1"));
        history.addMessage(ModelMessage.user("Msg 2"));

        // With max 3, Msg 1 should be dropped, System context maintained
        assertEquals(3, history.getMessages().size());
        assertEquals(Role.SYSTEM, history.getMessages().get(0).getRole());
        assertEquals("System context", history.getMessages().get(0).getContent());
        assertEquals("Reply 1", history.getMessages().get(1).getContent());
        assertEquals("Msg 2", history.getMessages().get(2).getContent());
    }

    @Test
    void testPruningWithoutSystemPrompt() {
        ConversationHistory history = new ConversationHistory(2);
        
        history.addMessage(ModelMessage.user("Msg 1"));
        history.addMessage(ModelMessage.assistant("Reply 1"));
        history.addMessage(ModelMessage.user("Msg 2"));

        // With max 2, Msg 1 should be dropped
        assertEquals(2, history.getMessages().size());
        assertEquals("Reply 1", history.getMessages().get(0).getContent());
        assertEquals("Msg 2", history.getMessages().get(1).getContent());
    }
}

package com.aegis.core.memory.history;

import com.aegis.core.model.gateway.dto.ModelMessage;
import com.aegis.core.model.gateway.dto.Role;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class ConversationHistory {
    private final List<ModelMessage> messages = new CopyOnWriteArrayList<>();
    private final int maxHistoryLength;

    public ConversationHistory(int maxHistoryLength) {
        this.maxHistoryLength = maxHistoryLength;
    }

    public void addMessage(ModelMessage message) {
        messages.add(message);
        pruneIfNecessary();
    }

    public void addMessages(List<ModelMessage> newMessages) {
        messages.addAll(newMessages);
        pruneIfNecessary();
    }

    public List<ModelMessage> getMessages() {
        return new ArrayList<>(messages);
    }

    public void clear() {
        messages.clear();
    }

    private void pruneIfNecessary() {
        if (messages.size() <= maxHistoryLength) {
            return;
        }

        // Keep the system prompt if it's the first message
        int startIndex = 0;
        if (!messages.isEmpty() && messages.get(0).getRole() == Role.SYSTEM) {
            startIndex = 1;
        }

        // Remove oldest messages to get back to maxHistoryLength
        int messagesToRemove = messages.size() - maxHistoryLength;
        if (messagesToRemove > 0 && messages.size() > startIndex) {
            // Safe sublist removal for CopyOnWriteArrayList usually requires iteration or creating a new list,
            // but remove(index) works fine.
            for (int i = 0; i < messagesToRemove; i++) {
                if (startIndex < messages.size()) {
                    messages.remove(startIndex);
                }
            }
        }
    }
}

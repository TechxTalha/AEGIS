package com.aegis.core.memory.context;

import com.aegis.core.memory.longterm.domain.MemoryNode;
import com.aegis.core.memory.longterm.service.LongTermMemoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * UserMemoryContextProvider extracts persistent user memories, personal profile attributes,
 * operational preferences, and constraints from LongTermMemoryService to ground the AI's reasoning.
 */
@Component
public class UserMemoryContextProvider implements ContextProvider {

    private final LongTermMemoryService memoryService;

    @Autowired
    public UserMemoryContextProvider(@Lazy LongTermMemoryService memoryService) {
        this.memoryService = memoryService;
    }

    @Override
    public String getContextName() {
        return "User Profile & Persistent Long-Term Memory";
    }

    @Override
    public String buildContext() {
        if (memoryService == null) {
            return "No persistent memories loaded.";
        }

        try {
            List<MemoryNode> memories = memoryService.getAllMemories();
            if (memories.isEmpty()) {
                return "No persistent user memories or traits recorded yet.";
            }

            // Group by category for high clarity
            Map<String, List<MemoryNode>> grouped = memories.stream()
                .collect(Collectors.groupingBy(m -> m.getCategory() != null ? m.getCategory().toUpperCase() : "GENERAL"));

            StringBuilder sb = new StringBuilder();
            for (Map.Entry<String, List<MemoryNode>> entry : grouped.entrySet()) {
                sb.append(entry.getKey()).append(":\n");
                for (MemoryNode node : entry.getValue()) {
                    sb.append("  • ").append(node.getContent()).append("\n");
                }
            }
            return sb.toString().trim();
        } catch (Exception e) {
            return "User memory temporarily unavailable: " + e.getMessage();
        }
    }

    /**
     * Builds a concise bulleted snippet specifically formatted for injection into LLM system prompts.
     */
    public String buildPromptSnippet() {
        if (memoryService == null) {
            return "No persistent memories available.";
        }

        try {
            List<MemoryNode> memories = memoryService.getAllMemories();
            if (memories.isEmpty()) {
                return "No persistent user profile recorded yet.";
            }

            return memories.stream()
                .map(m -> String.format("- [%s] %s", m.getCategory() != null ? m.getCategory().toUpperCase() : "INFO", m.getContent()))
                .collect(Collectors.joining("\n"));
        } catch (Exception e) {
            return "User profile temporarily unavailable.";
        }
    }
}

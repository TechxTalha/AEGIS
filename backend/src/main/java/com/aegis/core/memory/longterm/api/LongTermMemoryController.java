package com.aegis.core.memory.longterm.api;

import com.aegis.core.memory.longterm.domain.MemoryNode;
import com.aegis.core.memory.longterm.service.LongTermMemoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/memory/long-term")
public class LongTermMemoryController {

    private final LongTermMemoryService memoryService;

    @Autowired
    public LongTermMemoryController(LongTermMemoryService memoryService) {
        this.memoryService = memoryService;
    }

    @PostMapping
    public ResponseEntity<MemoryNode> createMemory(@RequestBody Map<String, String> request) {
        String category = request.getOrDefault("category", "FACT");
        String content = request.get("content");
        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(memoryService.saveMemory(category, content));
    }

    @GetMapping
    public ResponseEntity<List<MemoryNode>> getAllMemories() {
        return ResponseEntity.ok(memoryService.getAllMemories());
    }

    @GetMapping("/search")
    public ResponseEntity<List<MemoryNode>> searchMemories(@RequestParam String query) {
        return ResponseEntity.ok(memoryService.searchMemories(query));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMemory(@PathVariable UUID id) {
        memoryService.deleteMemory(id);
        return ResponseEntity.noContent().build();
    }
}

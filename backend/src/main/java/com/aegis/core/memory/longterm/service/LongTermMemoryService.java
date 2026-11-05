package com.aegis.core.memory.longterm.service;

import com.aegis.core.memory.longterm.domain.MemoryNode;
import com.aegis.core.memory.longterm.repository.MemoryNodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class LongTermMemoryService {

    private final MemoryNodeRepository repository;

    @Autowired
    public LongTermMemoryService(MemoryNodeRepository repository) {
        this.repository = repository;
    }

    public MemoryNode saveMemory(String category, String content) {
        MemoryNode node = new MemoryNode();
        node.setCategory(category);
        node.setContent(content);
        return repository.save(node);
    }

    public List<MemoryNode> getAllMemories() {
        return repository.findAll();
    }
    
    public List<MemoryNode> searchMemories(String keyword) {
        return repository.findByContentContainingIgnoreCase(keyword);
    }

    public MemoryNode saveOrUpdateMemory(String category, String content) {
        if (content == null || content.trim().isEmpty()) {
            return null;
        }
        String cleanContent = content.trim();
        String cleanCategory = category != null ? category.trim().toUpperCase() : "GENERAL";
        
        List<MemoryNode> existing = repository.findByContentContainingIgnoreCase(cleanContent);
        if (!existing.isEmpty()) {
            MemoryNode node = existing.get(0);
            node.setCategory(cleanCategory);
            node.setConfidenceScore(1.0);
            return repository.save(node);
        }

        MemoryNode node = new MemoryNode();
        node.setCategory(cleanCategory);
        node.setContent(cleanContent);
        node.setConfidenceScore(1.0);
        return repository.save(node);
    }

    public List<MemoryNode> getMemoriesByCategory(String category) {
        return repository.findByCategory(category);
    }

    public void deleteMemory(UUID id) {
        repository.deleteById(id);
    }
}

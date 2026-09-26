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

    public void deleteMemory(UUID id) {
        repository.deleteById(id);
    }
}

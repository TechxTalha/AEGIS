package com.aegis.core.memory.longterm.repository;

import com.aegis.core.memory.longterm.domain.MemoryNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MemoryNodeRepository extends JpaRepository<MemoryNode, UUID> {
    List<MemoryNode> findByCategory(String category);
    List<MemoryNode> findByContentContainingIgnoreCase(String keyword);
}

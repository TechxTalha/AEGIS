package com.aegis.agent.local;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AgentAuditLogRepository extends JpaRepository<AgentAuditLog, Long> {
}

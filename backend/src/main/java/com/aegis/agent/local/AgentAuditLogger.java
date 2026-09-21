package com.aegis.agent.local;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AgentAuditLogger {
    private static final Logger logger = LoggerFactory.getLogger(AgentAuditLogger.class);
    private final AgentAuditLogRepository repository;

    public AgentAuditLogger(AgentAuditLogRepository repository) {
        this.repository = repository;
    }

    public void log(String agentId, String action, String details, String outcome) {
        logger.info("AUDIT [Agent: {}] Action: {} | Outcome: {}", agentId, action, outcome);
        
        AgentAuditLog log = new AgentAuditLog();
        log.setAgentId(agentId);
        log.setAction(action);
        log.setDetails(details);
        log.setOutcome(outcome);
        log.setTimestamp(LocalDateTime.now());
        
        repository.save(log);
    }
}

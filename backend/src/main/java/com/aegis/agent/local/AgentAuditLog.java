package com.aegis.agent.local;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "agent_audit_logs")
public class AgentAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String agentId;
    private String action;
    
    @Column(columnDefinition = "TEXT")
    private String details;
    
    private String outcome;
    private LocalDateTime timestamp;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAgentId() { return agentId; }
    public void setAgentId(String agentId) { this.agentId = agentId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public String getOutcome() { return outcome; }
    public void setOutcome(String outcome) { this.outcome = outcome; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}

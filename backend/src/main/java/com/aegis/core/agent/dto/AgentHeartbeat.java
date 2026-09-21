package com.aegis.core.agent.dto;

public class AgentHeartbeat {
    private String status;

    public AgentHeartbeat() {}
    
    public AgentHeartbeat(String status) {
        this.status = status;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

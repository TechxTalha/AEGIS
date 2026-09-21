package com.aegis.core.agent.server;

import java.util.List;

public class AgentInfo {
    private String id;
    private String hostname;
    private String os;
    private List<String> capabilities;
    private long lastHeartbeat;

    public AgentInfo(String id, String hostname, String os, List<String> capabilities) {
        this.id = id;
        this.hostname = hostname;
        this.os = os;
        this.capabilities = capabilities;
    }

    public String getId() { return id; }
    public String getHostname() { return hostname; }
    public String getOs() { return os; }
    public List<String> getCapabilities() { return capabilities; }
    
    public long getLastHeartbeat() { return lastHeartbeat; }
    public void setLastHeartbeat(long lastHeartbeat) { this.lastHeartbeat = lastHeartbeat; }
}

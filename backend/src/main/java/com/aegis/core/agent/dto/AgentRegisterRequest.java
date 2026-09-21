package com.aegis.core.agent.dto;

import java.util.List;

public class AgentRegisterRequest {
    private String hostname;
    private String os;
    private List<String> capabilities;

    public String getHostname() { return hostname; }
    public void setHostname(String hostname) { this.hostname = hostname; }

    public String getOs() { return os; }
    public void setOs(String os) { this.os = os; }

    public List<String> getCapabilities() { return capabilities; }
    public void setCapabilities(List<String> capabilities) { this.capabilities = capabilities; }
}

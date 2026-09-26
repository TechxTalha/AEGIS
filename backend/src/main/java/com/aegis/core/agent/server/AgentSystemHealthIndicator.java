package com.aegis.core.agent.server;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AgentSystemHealthIndicator implements HealthIndicator {

    private final AgentManager agentManager;

    public AgentSystemHealthIndicator(AgentManager agentManager) {
        this.agentManager = agentManager;
    }

    @Override
    public Health health() {
        List<AgentInfo> activeAgents = agentManager.getActiveAgents();
        int count = activeAgents.size();
        
        if (count > 0) {
            return Health.up()
                    .withDetail("activeAgents", count)
                    .withDetail("status", "Agents are connected and available for execution")
                    .build();
        } else {
            // The system is "up" but potentially degraded if no agents are available to execute remote tasks
            return Health.up()
                    .withDetail("activeAgents", count)
                    .withDetail("status", "No agents currently connected. Remote tasks cannot be executed.")
                    .build();
        }
    }
}

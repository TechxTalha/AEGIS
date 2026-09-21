package com.aegis.core.agent.server;

import com.aegis.core.agent.dto.AgentHeartbeat;
import com.aegis.core.agent.dto.AgentRegisterRequest;
import com.aegis.core.agent.dto.AgentResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class AgentController {
    private static final Logger logger = LoggerFactory.getLogger(AgentController.class);
    
    private final AgentManager agentManager;

    public AgentController(AgentManager agentManager) {
        this.agentManager = agentManager;
    }

    @MessageMapping("/agent/register")
    public void registerAgent(Principal principal, @Payload AgentRegisterRequest request) {
        String agentId = principal.getName();
        agentManager.registerAgent(agentId, request);
    }

    @MessageMapping("/agent/heartbeat")
    public void receiveHeartbeat(Principal principal, @Payload AgentHeartbeat heartbeat) {
        agentManager.updateHeartbeat(principal.getName());
    }

    @MessageMapping("/agent/result")
    public void receiveResult(Principal principal, @Payload AgentResult result) {
        logger.info("Received execution result from Agent {}: Task {} -> Exit Code {}", 
            principal.getName(), result.getTaskId(), result.getExitCode());
        agentManager.completeTask(result.getTaskId(), result);
    }
}

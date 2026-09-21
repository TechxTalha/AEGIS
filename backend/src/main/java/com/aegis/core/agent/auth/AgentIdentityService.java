package com.aegis.core.agent.auth;

import com.aegis.core.auth.security.JwtTokenProvider;
import com.aegis.core.user.entity.Role;
import com.aegis.core.user.entity.User;
import com.aegis.core.user.RoleRepository;
import com.aegis.core.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.UUID;

@Service
public class AgentIdentityService {

    private static final Logger logger = LoggerFactory.getLogger(AgentIdentityService.class);
    private static final String LOCAL_AGENT_USERNAME = "local-agent-system";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    private String agentToken;

    public AgentIdentityService(UserRepository userRepository,
                                RoleRepository roleRepository,
                                PasswordEncoder passwordEncoder,
                                JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initializeAgentIdentity() {
        logger.info("Initializing Local Machine Agent Identity...");
        
        User agentUser = userRepository.findByUsername(LOCAL_AGENT_USERNAME)
                .orElseGet(() -> {
                    Role agentRole = roleRepository.findByName("ROLE_AGENT")
                        .orElseThrow(() -> new IllegalStateException("ROLE_AGENT not found in database!"));
                    
                    User newUser = new User();
                    newUser.setUsername(LOCAL_AGENT_USERNAME);
                    newUser.setEmail("agent@aegis.local");
                    // Generate random unguessable password
                    newUser.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
                    newUser.setRoles(Collections.singleton(agentRole));
                    return userRepository.save(newUser);
                });

        // Generate a long-lived JWT token for the agent
        // Spring Security context will just see this as a user with ROLE_AGENT
        // Generating a 10-year long-lived token for the agent
        this.agentToken = jwtTokenProvider.generateToken(agentUser.getUsername(), 10L * 365 * 24 * 60 * 60 * 1000);
        logger.info("Local Agent Identity established and token generated.");
    }

    public String getAgentToken() {
        if (agentToken == null) {
            throw new IllegalStateException("Agent token not initialized yet.");
        }
        return agentToken;
    }
    
    public String getAgentUsername() {
        return LOCAL_AGENT_USERNAME;
    }
}

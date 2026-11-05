package com.aegis.core.memory.longterm.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * UserProfileMemoryInitializer seeds foundational profile attributes, operating preferences,
 * and architecture guidelines into long-term memory so AEGIS has permanent context about Hunter from day one.
 */
@Component
public class UserProfileMemoryInitializer implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(UserProfileMemoryInitializer.class);

    private final LongTermMemoryService memoryService;

    public UserProfileMemoryInitializer(LongTermMemoryService memoryService) {
        this.memoryService = memoryService;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            if (memoryService.getAllMemories().isEmpty()) {
                logger.info("Initializing foundational long-term memory profile for Hunter...");
                memoryService.saveOrUpdateMemory("PROFILE", "Hunter is the creator, commander, and primary architect of AEGIS. All directives carry executive authority.");
                memoryService.saveOrUpdateMemory("PREFERENCE", "Hunter prefers concise, punchy, articulate, and technical responses. Avoid generic corporate fluff, excessive apologies, or patronizing preambles.");
                memoryService.saveOrUpdateMemory("CONTEXT", "Core architecture: Java 25 / Spring Boot 3.5 backend, React + Vite frontend, MySQL database, deployed on production Linux host 169.58.232.237.");
                memoryService.saveOrUpdateMemory("RULE", "Prioritize real system telemetry, live tool execution, and direct code solutions over theoretical speculation.");
                logger.info("Foundational long-term memory profile successfully established.");
            }
        } catch (Exception e) {
            logger.warn("Could not initialize baseline memory profile: {}", e.getMessage());
        }
    }
}

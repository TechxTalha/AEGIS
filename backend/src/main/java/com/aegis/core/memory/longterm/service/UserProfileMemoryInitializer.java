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
                memoryService.saveOrUpdateMemory("PROFILE", "Hunter is the creator and architect of AEGIS. When speaking directly to him, always address him respectfully as 'sir'. Do NOT call him 'Commander Hunter' or 'Hunter'.");
                memoryService.saveOrUpdateMemory("PREFERENCE", "Always address Hunter as 'sir' across all responses (e.g. 'Yes, sir', 'Right away, sir'). Never call him 'Commander Hunter' or 'Hunter' directly. Prefers concise, punchy, articulate, and technical responses without fluff.");
                memoryService.saveOrUpdateMemory("RULE", "Always address the user as 'sir'. Never refer to him as 'Commander Hunter' or 'Hunter' directly in dialogue.");
                memoryService.saveOrUpdateMemory("CONTEXT", "Core architecture: Java 25 / Spring Boot 3.5 backend, React + Vite frontend, MySQL database, deployed on production Linux host 169.58.232.237.");
                logger.info("Foundational long-term memory profile successfully established.");
            }
        } catch (Exception e) {
            logger.warn("Could not initialize baseline memory profile: {}", e.getMessage());
        }
    }
}

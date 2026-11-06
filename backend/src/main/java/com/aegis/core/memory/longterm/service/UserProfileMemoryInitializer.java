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
                memoryService.saveOrUpdateMemory("PROFILE", "Hunter is the creator and architect of AEGIS. He commands the system. Address him respectfully as 'sir'.");
                memoryService.saveOrUpdateMemory("PREFERENCE", "Address Hunter naturally as 'sir'. Avoid robotic canned preambles like 'Right away, sir'. Speak directly, conversationally, and intelligently. Be punchy and technical without unnecessary fluff.");
                memoryService.saveOrUpdateMemory("RULE", "Always address the user as 'sir'. Do not use 'Commander Hunter' or 'Hunter' directly in dialogue. Only use markdown tables when presenting multi-row structured system reports or tabular data, never for simple conversational answers.");
                memoryService.saveOrUpdateMemory("CONTEXT", "Operating base location: Rawalpindi, Pakistan (PKT timezone, UTC+5).");
                logger.info("Foundational long-term memory profile successfully established.");
            }
        } catch (Exception e) {
            logger.warn("Could not initialize baseline memory profile: {}", e.getMessage());
        }
    }
}

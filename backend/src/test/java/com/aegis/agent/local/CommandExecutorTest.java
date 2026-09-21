package com.aegis.agent.local;

import com.aegis.core.agent.dto.AgentResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;

class CommandExecutorTest {

    private CommandExecutor executor;
    private AgentAuditLogger mockLogger;

    @BeforeEach
    void setUp() {
        mockLogger = Mockito.mock(AgentAuditLogger.class);
        executor = new CommandExecutor(mockLogger);
    }

    @Test
    void testAllowedCommand() {
        // Using "java" which is an executable available on PATH
        AgentResult result = executor.executeCommand("task-1", "agent-1", Arrays.asList("java", "-version"), 5000L);
        
        assertTrue(result.isSuccess(), "Command should be successful");
        assertEquals(0, result.getExitCode());
        
        Mockito.verify(mockLogger, Mockito.times(2)).log(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void testForbiddenCommand() {
        // Using "rm" which is NOT in the whitelist
        AgentResult result = executor.executeCommand("task-2", "agent-1", Arrays.asList("rm", "-rf", "/"), 5000L);
        
        assertFalse(result.isSuccess());
        assertTrue(result.getErrorMessage().contains("not allowed"));
        
        Mockito.verify(mockLogger, Mockito.times(1)).log(anyString(), anyString(), anyString(), Mockito.eq("REJECTED"));
    }

    @Test
    void testEmptyCommand() {
        AgentResult result = executor.executeCommand("task-3", "agent-1", Collections.emptyList(), 5000L);
        assertFalse(result.isSuccess());
        assertEquals("Command arguments cannot be empty", result.getErrorMessage());
    }
}

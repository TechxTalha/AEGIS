package com.aegis.agent.local;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class FileSystemExecutorTest {

    private FileSystemExecutor executor;
    private AgentAuditLogger mockLogger;

    @BeforeEach
    void setUp() {
        mockLogger = Mockito.mock(AgentAuditLogger.class);
        executor = new FileSystemExecutor(mockLogger);
    }

    @Test
    void testWriteAndReadFile() throws Exception {
        String content = "test content";
        String path = "target/test-agent-file.txt";
        
        executor.writeFile("agent-1", path, content);
        String readContent = executor.readFile("agent-1", path);
        
        assertEquals(content, readContent);
        
        // Cleanup
        Files.deleteIfExists(Path.of(path));
    }

    @Test
    void testDirectoryTraversalPrevention() {
        assertThrows(SecurityException.class, () -> {
            executor.readFile("agent-1", "../../windows/system32/cmd.exe");
        });
    }
}

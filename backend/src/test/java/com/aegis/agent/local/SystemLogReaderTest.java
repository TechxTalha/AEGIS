package com.aegis.agent.local;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class SystemLogReaderTest {

    private SystemLogReader reader;
    private Path tempLogFile;
    private AgentAuditLogger mockLogger;

    @BeforeEach
    void setUp() throws IOException {
        mockLogger = Mockito.mock(AgentAuditLogger.class);
        reader = new SystemLogReader(mockLogger);
        tempLogFile = Files.createTempFile("test-log-", ".log");
        String content = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";
        Files.writeString(tempLogFile, content);
    }

    @AfterEach
    void tearDown() throws IOException {
        Files.deleteIfExists(tempLogFile);
    }

    @Test
    void testReadLogLines_tailShorterThanFile() {
        String result = reader.readLogLines("test-agent", tempLogFile.toString(), 2);
        assertEquals("Line 4\nLine 5", result);
    }

    @Test
    void testReadLogLines_tailLongerThanFile() {
        String result = reader.readLogLines("test-agent", tempLogFile.toString(), 10);
        assertEquals("Line 1\nLine 2\nLine 3\nLine 4\nLine 5", result);
    }

    @Test
    void testReadLogLines_fileNotFound() {
        String result = reader.readLogLines("test-agent", "/path/to/nonexistent/file.log", 10);
        assertTrue(result.startsWith("Log file not found"));
    }
}

package com.aegis.agent.local;

import org.springframework.stereotype.Component;
import java.io.IOException;
import java.nio.file.*;
import java.util.List;

@Component
public class SystemLogReader {
    private final AgentAuditLogger auditLogger;

    public SystemLogReader(AgentAuditLogger auditLogger) {
        this.auditLogger = auditLogger;
    }

    public String readLogLines(String agentId, String logPath, int tailLines) {
        if (logPath == null) {
            return "Error: logPath cannot be null";
        }
        if (tailLines <= 0) {
            tailLines = 100;
        }
        try {
            Path path = Paths.get(logPath);
            if (!Files.exists(path)) {
                return "Log file not found: " + logPath;
            }
            
            // Basic sanity check to prevent reading obvious sensitive binaries or keys
            String lowerPath = logPath.toLowerCase();
            if (lowerPath.contains(".ssh") || lowerPath.contains("shadow") || lowerPath.endsWith(".pem") || lowerPath.endsWith(".key")) {
                auditLogger.log(agentId, "sys.logs.read", "Attempt to read sensitive file: " + logPath, "REJECTED");
                return "Access denied: Path appears to contain sensitive material, not a standard log file.";
            }
            
            if (Files.size(path) > 10 * 1024 * 1024) {
                auditLogger.log(agentId, "sys.logs.read", "Log file too large: " + logPath, "REJECTED");
                return "Access denied: Log file is larger than 10MB. Please use sys.execute with native tail/grep instead.";
            }
            
            List<String> allLines = Files.readAllLines(path);
            auditLogger.log(agentId, "sys.logs.read", "Read " + Math.min(tailLines, allLines.size()) + " lines from " + logPath, "SUCCESS");
            if (allLines.size() <= tailLines) {
                return String.join("\n", allLines);
            }
            return String.join("\n", allLines.subList(allLines.size() - tailLines, allLines.size()));
        } catch (IOException e) {
            auditLogger.log(agentId, "sys.logs.read", "Failed to read: " + logPath, "FAILED");
            return "Failed to read log file: " + e.getMessage();
        }
    }
}

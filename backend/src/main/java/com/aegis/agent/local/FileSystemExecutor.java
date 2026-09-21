package com.aegis.agent.local;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FileSystemExecutor {
    private static final Logger logger = LoggerFactory.getLogger(FileSystemExecutor.class);
    private final AgentAuditLogger auditLogger;
    private final Path rootWorkspace;

    public FileSystemExecutor(AgentAuditLogger auditLogger) {
        this.auditLogger = auditLogger;
        // Restrict all agent filesystem operations to the current working directory
        this.rootWorkspace = Paths.get(System.getProperty("user.dir")).toAbsolutePath().normalize();
    }

    private Path resolveAndValidatePath(String relativePath) {
        Path target = rootWorkspace.resolve(relativePath).toAbsolutePath().normalize();
        if (!target.startsWith(rootWorkspace)) {
            throw new SecurityException("Path Traversal Attempt Detected! Access denied to: " + relativePath);
        }
        return target;
    }

    public String readFile(String agentId, String pathStr) {
        try {
            Path target = resolveAndValidatePath(pathStr);
            String content = Files.readString(target);
            auditLogger.log(agentId, "readFile", "Read file: " + target.toString(), "SUCCESS");
            return content;
        } catch (SecurityException se) {
            auditLogger.log(agentId, "readFile", "Traversal attempt: " + pathStr, "REJECTED");
            throw se;
        } catch (IOException e) {
            auditLogger.log(agentId, "readFile", "Failed to read: " + pathStr, "FAILED");
            throw new RuntimeException("Failed to read file: " + e.getMessage());
        }
    }

    public void writeFile(String agentId, String pathStr, String content) {
        try {
            Path target = resolveAndValidatePath(pathStr);
            // Ensure parent directory exists
            Files.createDirectories(target.getParent());
            Files.writeString(target, content, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            auditLogger.log(agentId, "writeFile", "Wrote file: " + target.toString(), "SUCCESS");
        } catch (SecurityException se) {
            auditLogger.log(agentId, "writeFile", "Traversal attempt: " + pathStr, "REJECTED");
            throw se;
        } catch (IOException e) {
            auditLogger.log(agentId, "writeFile", "Failed to write: " + pathStr, "FAILED");
            throw new RuntimeException("Failed to write file: " + e.getMessage());
        }
    }

    public List<String> listDirectory(String agentId, String pathStr) {
        try {
            Path target = resolveAndValidatePath(pathStr);
            List<String> list = Files.list(target)
                    .map(Path::getFileName)
                    .map(Path::toString)
                    .collect(Collectors.toList());
            auditLogger.log(agentId, "listDirectory", "Listed dir: " + target.toString(), "SUCCESS");
            return list;
        } catch (SecurityException se) {
            auditLogger.log(agentId, "listDirectory", "Traversal attempt: " + pathStr, "REJECTED");
            throw se;
        } catch (IOException e) {
            auditLogger.log(agentId, "listDirectory", "Failed to list: " + pathStr, "FAILED");
            throw new RuntimeException("Failed to list directory: " + e.getMessage());
        }
    }
}

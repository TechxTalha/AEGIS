package com.aegis.agent.local;

import com.aegis.core.agent.dto.AgentResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class CommandExecutor {
    private static final Logger logger = LoggerFactory.getLogger(CommandExecutor.class);
    
    private final AgentAuditLogger auditLogger;
    private final Map<String, Process> activeProcesses = new ConcurrentHashMap<>();
    
    private static final List<String> ALLOWED_COMMANDS = Arrays.asList(
        "ls", "pwd", "echo", "mvn", "npm", "git", "node", "java", "javac", "dir", "cd",
        "cat", "tail", "head", "grep", "awk", "sed", "systemctl", "journalctl", "docker",
        "powershell", "cmd", "bash", "sh", "ps", "top", "htop", "df", "du", "free"
    );

    public CommandExecutor(AgentAuditLogger auditLogger) {
        this.auditLogger = auditLogger;
    }

    public AgentResult executeCommand(String taskId, String agentId, List<String> commandArgs, long timeoutMs) {
        AgentResult result = new AgentResult();
        result.setTaskId(taskId);
        
        if (commandArgs == null || commandArgs.isEmpty()) {
            result.setSuccess(false);
            result.setErrorMessage("Command arguments cannot be empty");
            auditLogger.log(agentId, "executeCommand", "Empty command", "FAILED");
            return result;
        }

        String baseCommand = commandArgs.get(0);
        if (!ALLOWED_COMMANDS.contains(baseCommand)) {
            result.setSuccess(false);
            result.setErrorMessage("Command '" + baseCommand + "' is not allowed by strict security policy.");
            auditLogger.log(agentId, "executeCommand", "Attempted forbidden command: " + baseCommand, "REJECTED");
            return result;
        }

        ProcessBuilder pb = new ProcessBuilder(commandArgs);
        String fullCommand = String.join(" ", commandArgs);
        auditLogger.log(agentId, "executeCommand", "Executing: " + fullCommand, "STARTED");

        try {
            Process process = pb.start();
            activeProcesses.put(taskId, process);

            boolean finished = process.waitFor(timeoutMs, TimeUnit.MILLISECONDS);
            if (!finished) {
                process.descendants().forEach(ProcessHandle::destroyForcibly);
                process.destroyForcibly();
                result.setSuccess(false);
                result.setErrorMessage("Process timed out after " + timeoutMs + "ms");
                auditLogger.log(agentId, "executeCommand", "Timeout: " + fullCommand, "TIMEOUT");
            } else {
                result.setSuccess(process.exitValue() == 0);
                result.setExitCode(process.exitValue());
                auditLogger.log(agentId, "executeCommand", "Finished: " + fullCommand, result.isSuccess() ? "SUCCESS" : "FAILED");
            }

            // Capture output
            try (BufferedReader stdoutReader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                 BufferedReader stderrReader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                result.setStdout(stdoutReader.lines().collect(Collectors.joining("\n")));
                result.setStderr(stderrReader.lines().collect(Collectors.joining("\n")));
            }
        } catch (Exception e) {
            result.setSuccess(false);
            result.setErrorMessage("Execution failed: " + e.getMessage());
            auditLogger.log(agentId, "executeCommand", "Exception: " + e.getMessage(), "ERROR");
        } finally {
            activeProcesses.remove(taskId);
        }

        return result;
    }

    public void cancelCommand(String taskId, String agentId) {
        Process process = activeProcesses.get(taskId);
        if (process != null && process.isAlive()) {
            process.descendants().forEach(ProcessHandle::destroyForcibly);
            process.destroyForcibly();
            auditLogger.log(agentId, "cancelCommand", "Cancelled task: " + taskId, "CANCELLED");
        }
    }
}

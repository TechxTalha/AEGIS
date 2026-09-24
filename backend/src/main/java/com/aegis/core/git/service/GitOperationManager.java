package com.aegis.core.git.service;

import com.aegis.core.git.model.GitCommit;
import com.aegis.core.git.model.GitStatusResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class GitOperationManager {
    private static final Logger logger = LoggerFactory.getLogger(GitOperationManager.class);

    public boolean isGitRepository(String path) {
        try {
            int exitCode = runCommand(new File(path), "git", "rev-parse", "--is-inside-work-tree").exitCode;
            return exitCode == 0;
        } catch (Exception e) {
            return false;
        }
    }

    public GitStatusResult getStatus(String path) {
        GitStatusResult result = new GitStatusResult();
        result.setModified(new ArrayList<>());
        result.setUntracked(new ArrayList<>());
        result.setStaged(new ArrayList<>());

        try {
            // Get branch
            CommandResult branchResult = runCommand(new File(path), "git", "rev-parse", "--abbrev-ref", "HEAD");
            if (branchResult.exitCode == 0) {
                result.setBranch(branchResult.stdout.trim());
            }

            // Get status
            CommandResult statusResult = runCommand(new File(path), "git", "status", "-s");
            if (statusResult.exitCode == 0 && !statusResult.stdout.trim().isEmpty()) {
                String[] lines = statusResult.stdout.split("\n");
                for (String line : lines) {
                    if (line.length() < 3) continue;
                    String status = line.substring(0, 2);
                    String file = line.substring(3).trim();
                    
                    if (status.equals("??")) {
                        result.getUntracked().add(file);
                    } else if (status.contains("M") && status.charAt(0) != ' ') {
                        result.getStaged().add(file);
                    } else if (status.contains("M")) {
                        result.getModified().add(file);
                    } else {
                        // Other statuses like A, D, R, etc. treated as modified/staged for simplicity
                        result.getModified().add(file);
                    }
                }
                result.setClean(false);
            } else {
                result.setClean(true);
            }
        } catch (Exception e) {
            logger.error("Error getting git status", e);
        }
        return result;
    }

    public List<GitCommit> getCommitHistory(String path, int limit) {
        List<GitCommit> commits = new ArrayList<>();
        try {
            CommandResult result = runCommand(new File(path), "git", "log", "-n", String.valueOf(limit), "--pretty=format:%h|%an|%ar|%s");
            if (result.exitCode == 0 && !result.stdout.trim().isEmpty()) {
                String[] lines = result.stdout.split("\n");
                for (String line : lines) {
                    String[] parts = line.split("\\|", 4);
                    if (parts.length == 4) {
                        commits.add(new GitCommit(parts[0], parts[1], parts[2], parts[3]));
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error getting commit history", e);
        }
        return commits;
    }

    public String getDiff(String path, String file) {
        try {
            List<String> cmd = new ArrayList<>(List.of("git", "diff"));
            if (file != null && !file.trim().isEmpty()) {
                cmd.add("--");
                cmd.add(file);
            }
            CommandResult result = runCommand(new File(path), cmd.toArray(new String[0]));
            return result.stdout;
        } catch (Exception e) {
            logger.error("Error getting diff", e);
            return "Error getting diff: " + e.getMessage();
        }
    }

    public String getBranches(String path) {
        try {
            CommandResult result = runCommand(new File(path), "git", "branch", "-a");
            return result.stdout;
        } catch (Exception e) {
            logger.error("Error getting branches", e);
            return "Error getting branches: " + e.getMessage();
        }
    }

    private CommandResult runCommand(File directory, String... command) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(directory);
        Process process = pb.start();
        
        java.util.concurrent.CompletableFuture<String> stdoutFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                return reader.lines().collect(java.util.stream.Collectors.joining("\n"));
            } catch (Exception e) {
                return "";
            }
        });

        java.util.concurrent.CompletableFuture<String> stderrFuture = java.util.concurrent.CompletableFuture.supplyAsync(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                return reader.lines().collect(java.util.stream.Collectors.joining("\n"));
            } catch (Exception e) {
                return "";
            }
        });

        boolean finished = process.waitFor(10, TimeUnit.SECONDS);
        if (!finished) {
            process.destroyForcibly();
            throw new RuntimeException("Command timed out");
        }

        return new CommandResult(process.exitValue(), stdoutFuture.join(), stderrFuture.join());
    }

    private static class CommandResult {
        int exitCode;
        String stdout;
        String stderr;

        CommandResult(int exitCode, String stdout, String stderr) {
            this.exitCode = exitCode;
            this.stdout = stdout;
            this.stderr = stderr;
        }
    }
}

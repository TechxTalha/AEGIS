package com.aegis.core.git.service;

import com.aegis.core.tool.executor.ToolExecutionEngine;
import com.aegis.core.tool.executor.ToolExecutor;
import com.aegis.core.tool.model.RiskLevel;
import com.aegis.core.tool.model.ToolDefinition;
import com.aegis.core.tool.model.ToolInvocation;
import com.aegis.core.tool.model.ToolResult;
import com.aegis.core.tool.registry.ToolRegistry;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ProjectToolRegistrar {

    private final ToolRegistry toolRegistry;
    private final ToolExecutionEngine toolExecutionEngine;
    private final GitOperationManager gitOperationManager;
    private final ProjectAnalyzerService projectAnalyzerService;
    private final ObjectMapper objectMapper;

    public ProjectToolRegistrar(ToolRegistry toolRegistry,
                                ToolExecutionEngine toolExecutionEngine,
                                GitOperationManager gitOperationManager,
                                ProjectAnalyzerService projectAnalyzerService,
                                ObjectMapper objectMapper) {
        this.toolRegistry = toolRegistry;
        this.toolExecutionEngine = toolExecutionEngine;
        this.gitOperationManager = gitOperationManager;
        this.projectAnalyzerService = projectAnalyzerService;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void registerTools() {
        registerGitStatusTool();
        registerGitLogTool();
        registerGitDiffTool();
        registerGitBranchTool();
        registerProjectInspectTool();
    }

    private void registerGitStatusTool() {
        ToolDefinition tool = new ToolDefinition();
        tool.setId("git.status");
        tool.setName("Git Status");
        tool.setDescription("Retrieves the current git status of a repository.");
        tool.setRiskLevel(RiskLevel.LOW);
        tool.setInputSchema("{\n" +
            "  \"type\": \"object\",\n" +
            "  \"properties\": {\n" +
            "    \"path\": { \"type\": \"string\", \"description\": \"Absolute path to the repository\" }\n" +
            "  },\n" +
            "  \"required\": [\"path\"]\n" +
            "}");

        toolRegistry.registerTool(tool);
        toolExecutionEngine.registerDynamicExecutor(tool.getId(), new ToolExecutor() {
            @Override
            public ToolDefinition getDefinition() { return tool; }

            @Override
            public ToolResult execute(ToolInvocation invocation) {
                String path = (String) invocation.getParameters().get("path");
                if (!gitOperationManager.isGitRepository(path)) {
                    return ToolResult.failure("Not a git repository: " + path, 0);
                }
                try {
                    String payload = objectMapper.writeValueAsString(gitOperationManager.getStatus(path));
                    return ToolResult.success(payload, 0);
                } catch (Exception e) {
                    return ToolResult.failure("Error parsing status: " + e.getMessage(), 0);
                }
            }
        });
    }

    private void registerGitLogTool() {
        ToolDefinition tool = new ToolDefinition();
        tool.setId("git.log");
        tool.setName("Git Log");
        tool.setDescription("Retrieves the commit history of a repository.");
        tool.setRiskLevel(RiskLevel.LOW);
        tool.setInputSchema("{\n" +
            "  \"type\": \"object\",\n" +
            "  \"properties\": {\n" +
            "    \"path\": { \"type\": \"string\", \"description\": \"Absolute path to the repository\" },\n" +
            "    \"limit\": { \"type\": \"integer\", \"description\": \"Max number of commits\" }\n" +
            "  },\n" +
            "  \"required\": [\"path\"]\n" +
            "}");

        toolRegistry.registerTool(tool);
        toolExecutionEngine.registerDynamicExecutor(tool.getId(), new ToolExecutor() {
            @Override
            public ToolDefinition getDefinition() { return tool; }

            @Override
            public ToolResult execute(ToolInvocation invocation) {
                String path = (String) invocation.getParameters().get("path");
                Integer limit = (Integer) invocation.getParameters().get("limit");
                if (limit == null || limit <= 0) limit = 10;
                if (!gitOperationManager.isGitRepository(path)) {
                    return ToolResult.failure("Not a git repository: " + path, 0);
                }
                try {
                    String payload = objectMapper.writeValueAsString(gitOperationManager.getCommitHistory(path, limit));
                    return ToolResult.success(payload, 0);
                } catch (Exception e) {
                    return ToolResult.failure("Error parsing log: " + e.getMessage(), 0);
                }
            }
        });
    }

    private void registerGitDiffTool() {
        ToolDefinition tool = new ToolDefinition();
        tool.setId("git.diff");
        tool.setName("Git Diff");
        tool.setDescription("Retrieves the diff of a repository or specific file.");
        tool.setRiskLevel(RiskLevel.LOW);
        tool.setInputSchema("{\n" +
            "  \"type\": \"object\",\n" +
            "  \"properties\": {\n" +
            "    \"path\": { \"type\": \"string\", \"description\": \"Absolute path to the repository\" },\n" +
            "    \"file\": { \"type\": \"string\", \"description\": \"Optional relative file path\" }\n" +
            "  },\n" +
            "  \"required\": [\"path\"]\n" +
            "}");

        toolRegistry.registerTool(tool);
        toolExecutionEngine.registerDynamicExecutor(tool.getId(), new ToolExecutor() {
            @Override
            public ToolDefinition getDefinition() { return tool; }

            @Override
            public ToolResult execute(ToolInvocation invocation) {
                String path = (String) invocation.getParameters().get("path");
                String file = (String) invocation.getParameters().get("file");
                if (!gitOperationManager.isGitRepository(path)) {
                    return ToolResult.failure("Not a git repository: " + path, 0);
                }
                return ToolResult.success(gitOperationManager.getDiff(path, file), 0);
            }
        });
    }

    private void registerGitBranchTool() {
        ToolDefinition tool = new ToolDefinition();
        tool.setId("git.branch");
        tool.setName("Git Branch");
        tool.setDescription("Retrieves branch information of a repository.");
        tool.setRiskLevel(RiskLevel.LOW);
        tool.setInputSchema("{\n" +
            "  \"type\": \"object\",\n" +
            "  \"properties\": {\n" +
            "    \"path\": { \"type\": \"string\", \"description\": \"Absolute path to the repository\" }\n" +
            "  },\n" +
            "  \"required\": [\"path\"]\n" +
            "}");

        toolRegistry.registerTool(tool);
        toolExecutionEngine.registerDynamicExecutor(tool.getId(), new ToolExecutor() {
            @Override
            public ToolDefinition getDefinition() { return tool; }

            @Override
            public ToolResult execute(ToolInvocation invocation) {
                String path = (String) invocation.getParameters().get("path");
                if (!gitOperationManager.isGitRepository(path)) {
                    return ToolResult.failure("Not a git repository: " + path, 0);
                }
                return ToolResult.success(gitOperationManager.getBranches(path), 0);
            }
        });
    }

    private void registerProjectInspectTool() {
        ToolDefinition tool = new ToolDefinition();
        tool.setId("project.inspect");
        tool.setName("Project Inspect");
        tool.setDescription("Detects the project type and retrieves build commands.");
        tool.setRiskLevel(RiskLevel.LOW);
        tool.setInputSchema("{\n" +
            "  \"type\": \"object\",\n" +
            "  \"properties\": {\n" +
            "    \"path\": { \"type\": \"string\", \"description\": \"Absolute path to the project\" }\n" +
            "  },\n" +
            "  \"required\": [\"path\"]\n" +
            "}");

        toolRegistry.registerTool(tool);
        toolExecutionEngine.registerDynamicExecutor(tool.getId(), new ToolExecutor() {
            @Override
            public ToolDefinition getDefinition() { return tool; }

            @Override
            public ToolResult execute(ToolInvocation invocation) {
                String path = (String) invocation.getParameters().get("path");
                try {
                    String payload = objectMapper.writeValueAsString(projectAnalyzerService.analyzeProject(path));
                    return ToolResult.success(payload, 0);
                } catch (Exception e) {
                    return ToolResult.failure("Error analyzing project: " + e.getMessage(), 0);
                }
            }
        });
    }
}

package com.aegis.core.tool.model;

import java.util.List;
import java.util.Map;

public class ToolDefinition {
    private String id;
    private String name;
    private String description;
    private String inputSchema;
    private String outputSchema;
    private RiskLevel riskLevel;
    private ToolStatus status;
    private Map<String, String> capabilityMetadata;
    private List<String> requiredPermissions;
    private ExecutionConstraints executionConstraints;

    public ToolDefinition() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getInputSchema() { return inputSchema; }
    public void setInputSchema(String inputSchema) { this.inputSchema = inputSchema; }

    public String getOutputSchema() { return outputSchema; }
    public void setOutputSchema(String outputSchema) { this.outputSchema = outputSchema; }

    public RiskLevel getRiskLevel() { return riskLevel; }
    public void setRiskLevel(RiskLevel riskLevel) { this.riskLevel = riskLevel; }

    public ToolStatus getStatus() { return status; }
    public void setStatus(ToolStatus status) { this.status = status; }

    public Map<String, String> getCapabilityMetadata() { return capabilityMetadata; }
    public void setCapabilityMetadata(Map<String, String> capabilityMetadata) { this.capabilityMetadata = capabilityMetadata; }

    public List<String> getRequiredPermissions() { return requiredPermissions; }
    public void setRequiredPermissions(List<String> requiredPermissions) { this.requiredPermissions = requiredPermissions; }

    public ExecutionConstraints getExecutionConstraints() { return executionConstraints; }
    public void setExecutionConstraints(ExecutionConstraints executionConstraints) { this.executionConstraints = executionConstraints; }
}

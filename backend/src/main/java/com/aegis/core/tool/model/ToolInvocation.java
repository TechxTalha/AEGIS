package com.aegis.core.tool.model;

import java.util.Map;

public class ToolInvocation {
    private String toolId;
    private Map<String, Object> parameters;
    private String taskId;

    public ToolInvocation() {}

    public ToolInvocation(String toolId, Map<String, Object> parameters, String taskId) {
        this.toolId = toolId;
        this.parameters = parameters;
        this.taskId = taskId;
    }

    public String getToolId() { return toolId; }
    public void setToolId(String toolId) { this.toolId = toolId; }

    public Map<String, Object> getParameters() { return parameters; }
    public void setParameters(Map<String, Object> parameters) { this.parameters = parameters; }

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }
}

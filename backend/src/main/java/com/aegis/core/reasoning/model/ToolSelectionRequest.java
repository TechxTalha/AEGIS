package com.aegis.core.reasoning.model;

import com.aegis.core.tool.model.ToolDefinition;
import java.util.List;

public class ToolSelectionRequest {
    private String stepDescription;
    private String stepId;
    private List<ToolDefinition> availableTools;
    private String contextDump;

    public ToolSelectionRequest() {}

    public String getStepDescription() { return stepDescription; }
    public void setStepDescription(String stepDescription) { this.stepDescription = stepDescription; }
    public String getStepId() { return stepId; }
    public void setStepId(String stepId) { this.stepId = stepId; }
    public List<ToolDefinition> getAvailableTools() { return availableTools; }
    public void setAvailableTools(List<ToolDefinition> availableTools) { this.availableTools = availableTools; }
    public String getContextDump() { return contextDump; }
    public void setContextDump(String contextDump) { this.contextDump = contextDump; }
}

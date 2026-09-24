package com.aegis.core.model.gateway.dto;

import java.util.List;

public class ModelResponse {
    private String content;
    private List<ToolCallRequest> toolCalls;
    private ModelUsage usage;

    public ModelResponse() {}

    public ModelResponse(String content, List<ToolCallRequest> toolCalls, ModelUsage usage) {
        this.content = content;
        this.toolCalls = toolCalls;
        this.usage = usage;
    }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public List<ToolCallRequest> getToolCalls() { return toolCalls; }
    public void setToolCalls(List<ToolCallRequest> toolCalls) { this.toolCalls = toolCalls; }
    public ModelUsage getUsage() { return usage; }
    public void setUsage(ModelUsage usage) { this.usage = usage; }
}

package com.aegis.core.model.gateway.dto;

import com.aegis.core.tool.model.ToolDefinition;
import java.util.List;

public class ModelRequest {
    private List<ModelMessage> messages;
    private List<ToolDefinition> tools;
    private Double temperature;

    public ModelRequest() {}

    public ModelRequest(List<ModelMessage> messages, List<ToolDefinition> tools, Double temperature) {
        this.messages = messages;
        this.tools = tools;
        this.temperature = temperature;
    }

    public List<ModelMessage> getMessages() { return messages; }
    public void setMessages(List<ModelMessage> messages) { this.messages = messages; }
    public List<ToolDefinition> getTools() { return tools; }
    public void setTools(List<ToolDefinition> tools) { this.tools = tools; }
    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }
}

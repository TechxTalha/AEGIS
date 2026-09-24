package com.aegis.core.model.gateway.dto;

import java.util.List;

public class ModelMessage {
    private Role role;
    private String content;
    private String toolCallId; // Used when role == TOOL
    private List<ToolCallRequest> toolCalls; // Used when role == ASSISTANT

    public ModelMessage() {}

    public static ModelMessage system(String content) {
        ModelMessage msg = new ModelMessage();
        msg.setRole(Role.SYSTEM);
        msg.setContent(content);
        return msg;
    }

    public static ModelMessage user(String content) {
        ModelMessage msg = new ModelMessage();
        msg.setRole(Role.USER);
        msg.setContent(content);
        return msg;
    }

    public static ModelMessage assistant(String content) {
        ModelMessage msg = new ModelMessage();
        msg.setRole(Role.ASSISTANT);
        msg.setContent(content);
        return msg;
    }

    public static ModelMessage assistantWithTools(String content, List<ToolCallRequest> toolCalls) {
        ModelMessage msg = new ModelMessage();
        msg.setRole(Role.ASSISTANT);
        msg.setContent(content);
        msg.setToolCalls(toolCalls);
        return msg;
    }

    public static ModelMessage tool(String toolCallId, String content) {
        ModelMessage msg = new ModelMessage();
        msg.setRole(Role.TOOL);
        msg.setToolCallId(toolCallId);
        msg.setContent(content);
        return msg;
    }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getToolCallId() { return toolCallId; }
    public void setToolCallId(String toolCallId) { this.toolCallId = toolCallId; }
    public List<ToolCallRequest> getToolCalls() { return toolCalls; }
    public void setToolCalls(List<ToolCallRequest> toolCalls) { this.toolCalls = toolCalls; }
}

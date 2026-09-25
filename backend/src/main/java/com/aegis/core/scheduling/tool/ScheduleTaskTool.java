package com.aegis.core.scheduling.tool;

import com.aegis.core.scheduling.engine.SchedulingService;
import com.aegis.core.scheduling.model.ScheduledTask;
import com.aegis.core.tool.executor.ToolExecutor;
import com.aegis.core.tool.model.RiskLevel;
import com.aegis.core.tool.model.ToolDefinition;
import com.aegis.core.tool.model.ToolInvocation;
import com.aegis.core.tool.model.ToolResult;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;

@Component
public class ScheduleTaskTool implements ToolExecutor {

    public static final String TOOL_ID = "schedule-task";
    private final SchedulingService schedulingService;

    public ScheduleTaskTool(SchedulingService schedulingService) {
        this.schedulingService = schedulingService;
    }

    @Override
    public ToolDefinition getDefinition() {
        ToolDefinition definition = new ToolDefinition();
        definition.setId(TOOL_ID);
        definition.setName("Schedule Task");
        definition.setDescription("Schedules a background task to be executed at a later time.");
        definition.setRiskLevel(RiskLevel.MEDIUM);
        
        definition.setInputSchema("{\"type\": \"object\", \"properties\": {\"objective\": {\"type\": \"string\", \"description\": \"The task to execute\"}, \"delayMinutes\": {\"type\": \"number\", \"description\": \"Minutes from now to execute\"}}, \"required\": [\"objective\", \"delayMinutes\"]}");

        return definition;
    }

    @Override
    public ToolResult execute(ToolInvocation invocation) {
        try {
            Map<String, Object> params = invocation.getParameters();
            String objective = (String) params.get("objective");
            Object delayMinutesObj = params.get("delayMinutes");
            
            int delayMinutes = 0;
            if (delayMinutesObj instanceof Number) {
                delayMinutes = ((Number) delayMinutesObj).intValue();
            } else if (delayMinutesObj instanceof String) {
                delayMinutes = Integer.parseInt((String) delayMinutesObj);
            }

            LocalDateTime executeAt = LocalDateTime.now().plusMinutes(delayMinutes);
            
            ScheduledTask task = new ScheduledTask(
                java.util.UUID.randomUUID().toString(),
                objective,
                null,
                executeAt
            );
            
            schedulingService.scheduleTask(task);
            
            return ToolResult.success("Task scheduled successfully for " + executeAt, 0);
        } catch (Exception e) {
            return ToolResult.failure("Failed to schedule task: " + e.getMessage(), 0);
        }
    }
}

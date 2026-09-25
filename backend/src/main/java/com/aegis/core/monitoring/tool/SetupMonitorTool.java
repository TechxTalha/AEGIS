package com.aegis.core.monitoring.tool;

import com.aegis.core.monitoring.engine.ProactiveMonitoringService;
import com.aegis.core.monitoring.model.MonitorCondition;
import com.aegis.core.tool.executor.ToolExecutor;
import com.aegis.core.tool.model.RiskLevel;
import com.aegis.core.tool.model.ToolDefinition;
import com.aegis.core.tool.model.ToolInvocation;
import com.aegis.core.tool.model.ToolResult;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class SetupMonitorTool implements ToolExecutor {

    public static final String TOOL_ID = "setup-monitor";
    private final ProactiveMonitoringService monitoringService;

    public SetupMonitorTool(ProactiveMonitoringService monitoringService) {
        this.monitoringService = monitoringService;
    }

    @Override
    public ToolDefinition getDefinition() {
        ToolDefinition definition = new ToolDefinition();
        definition.setId(TOOL_ID);
        definition.setName("Setup Monitor");
        definition.setDescription("Sets up a proactive monitor to watch a specific system metric.");
        definition.setRiskLevel(RiskLevel.LOW);
        
        definition.setInputSchema("{\"type\": \"object\", \"properties\": {\"metric\": {\"type\": \"string\", \"description\": \"Metric name (e.g. cpu_usage, disk_usage)\"}, \"threshold\": {\"type\": \"number\"}, \"operator\": {\"type\": \"string\", \"description\": \"<, >, ==\"}, \"actionObjective\": {\"type\": \"string\", \"description\": \"Optional objective to run when triggered\"}}, \"required\": [\"metric\", \"threshold\", \"operator\"]}");

        return definition;
    }

    @Override
    public ToolResult execute(ToolInvocation invocation) {
        try {
            Map<String, Object> params = invocation.getParameters();
            String metric = (String) params.get("metric");
            Object thresholdObj = params.get("threshold");
            String operator = (String) params.get("operator");
            String actionObjective = (String) params.getOrDefault("actionObjective", "");

            double threshold = 0.0;
            if (thresholdObj instanceof Number) {
                threshold = ((Number) thresholdObj).doubleValue();
            } else if (thresholdObj instanceof String) {
                threshold = Double.parseDouble((String) thresholdObj);
            }

            MonitorCondition condition = new MonitorCondition(
                    java.util.UUID.randomUUID().toString(),
                    metric,
                    threshold,
                    operator,
                    actionObjective
            );
            
            monitoringService.registerCondition(condition);
            
            return ToolResult.success("Monitor condition registered successfully for " + metric, 0);
        } catch (Exception e) {
            return ToolResult.failure("Failed to register monitor condition: " + e.getMessage(), 0);
        }
    }
}

package com.aegis.core.monitoring.engine;

import com.aegis.core.monitoring.model.MonitorAlert;
import com.aegis.core.monitoring.model.MonitorCondition;
import com.aegis.core.notification.NotificationService;
import com.aegis.core.planning.execution.PlanExecutionEngine;
import com.aegis.core.planning.model.Plan;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ProactiveMonitoringService {
    private static final Logger logger = LoggerFactory.getLogger(ProactiveMonitoringService.class);

    private final Map<String, MonitorCondition> conditions = new ConcurrentHashMap<>();
    private final MetricsProviderService metricsProvider;
    private final NotificationService notificationService;
    private final PlanExecutionEngine planExecutionEngine;

    public ProactiveMonitoringService(MetricsProviderService metricsProvider, NotificationService notificationService, PlanExecutionEngine planExecutionEngine) {
        this.metricsProvider = metricsProvider;
        this.notificationService = notificationService;
        this.planExecutionEngine = planExecutionEngine;
    }

    public void registerCondition(MonitorCondition condition) {
        conditions.put(condition.getId(), condition);
        logger.info("Registered new monitor condition: {} for metric {}", condition.getId(), condition.getMetric());
    }

    public List<MonitorCondition> getAllConditions() {
        return new ArrayList<>(conditions.values());
    }

    @Scheduled(fixedRate = 30000) // Poll every 30 seconds for simulation
    public void evaluateConditions() {
        for (MonitorCondition condition : conditions.values()) {
            double currentValue = metricsProvider.getMetricValue(condition.getMetric());
            boolean triggered = evaluate(currentValue, condition.getThreshold(), condition.getOperator());
            
            if (triggered) {
                logger.warn("Monitor alert triggered! Condition {}: {} {} {}", condition.getId(), condition.getMetric(), condition.getOperator(), condition.getThreshold());
                
                MonitorAlert alert = new MonitorAlert(
                        java.util.UUID.randomUUID().toString(),
                        condition.getId(),
                        condition.getMetric(),
                        currentValue,
                        LocalDateTime.now()
                );
                
                notificationService.notify(alert.getAlertId(), "ALERT: " + condition.getMetric() + " is currently at " + currentValue, com.aegis.core.notification.model.NotificationPriority.HIGH, com.aegis.core.notification.model.NotificationCategory.MONITORING_ALERT);

                if (condition.getActionObjective() != null && !condition.getActionObjective().isEmpty()) {
                    executeProactiveAction(condition);
                }
            }
        }
    }

    private boolean evaluate(double value, double threshold, String operator) {
        switch (operator) {
            case ">": return value > threshold;
            case "<": return value < threshold;
            case ">=": return value >= threshold;
            case "<=": return value <= threshold;
            case "==": return value == threshold;
            case "!=": return value != threshold;
            default: return false;
        }
    }

    private void executeProactiveAction(MonitorCondition condition) {
        new Thread(() -> {
            try {
                Plan plan = new Plan();
                plan.setId("proactive-plan-" + java.util.UUID.randomUUID().toString());
                plan.setObjective(condition.getActionObjective());
                logger.info("Executing proactive plan: {}", plan.getObjective());
                planExecutionEngine.executePlan(plan);
            } catch (Exception e) {
                logger.error("Failed to execute proactive action for condition {}", condition.getId(), e);
            }
        }).start();
    }
}

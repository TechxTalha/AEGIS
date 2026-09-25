package com.aegis.core.scheduling.engine;

import com.aegis.core.scheduling.model.ScheduledTask;
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
public class SchedulingService {
    private static final Logger logger = LoggerFactory.getLogger(SchedulingService.class);
    
    private final Map<String, ScheduledTask> tasks = new ConcurrentHashMap<>();
    private final PlanExecutionEngine executionEngine;
    private final NotificationService notificationService;

    public SchedulingService(PlanExecutionEngine executionEngine, NotificationService notificationService) {
        this.executionEngine = executionEngine;
        this.notificationService = notificationService;
    }

    public void scheduleTask(ScheduledTask task) {
        tasks.put(task.getTaskId(), task);
        logger.info("Scheduled task {}: {} (Execution time: {})", task.getTaskId(), task.getObjective(), task.getExecuteAt());
    }

    public List<ScheduledTask> getAllTasks() {
        return new ArrayList<>(tasks.values());
    }

    // Runs every minute to check for due tasks
    @Scheduled(fixedRate = 60000)
    public void pollTasks() {
        LocalDateTime now = LocalDateTime.now();
        for (ScheduledTask task : tasks.values()) {
            if ("PENDING".equals(task.getStatus()) && task.getExecuteAt() != null && !task.getExecuteAt().isAfter(now)) {
                executeTaskAsync(task);
            }
        }
    }

    private void executeTaskAsync(ScheduledTask task) {
        task.setStatus("RUNNING");
        logger.info("Executing scheduled task {}: {}", task.getTaskId(), task.getObjective());
        
        // In a real system, we'd persist the status change to a DB.
        
        new Thread(() -> {
            try {
                // Create a plan with a single goal based on the objective
                Plan plan = new Plan();
                plan.setId(task.getTaskId());
                plan.setObjective(task.getObjective());
                // Typically, we'd use the planner to break this down, but for simulation we assume executionEngine can handle it.
                
                // For simplicity, we just pass it to the engine.
                executionEngine.executePlan(plan);
                boolean success = (plan.getStatus() == com.aegis.core.planning.model.PlanStatus.COMPLETED);
                
                if (success) {
                    task.setStatus("COMPLETED");
                    notificationService.notify(task.getTaskId(), "Task completed successfully: " + task.getObjective(), com.aegis.core.notification.model.NotificationPriority.LOW, com.aegis.core.notification.model.NotificationCategory.BACKGROUND_TASK);
                } else {
                    task.setStatus("FAILED");
                    notificationService.notify(task.getTaskId(), "Task failed: " + task.getObjective(), com.aegis.core.notification.model.NotificationPriority.MEDIUM, com.aegis.core.notification.model.NotificationCategory.BACKGROUND_TASK);
                }
            } catch (Exception e) {
                logger.error("Exception while executing scheduled task", e);
                task.setStatus("FAILED");
                notificationService.notify(task.getTaskId(), "Task failed with exception: " + e.getMessage(), com.aegis.core.notification.model.NotificationPriority.HIGH, com.aegis.core.notification.model.NotificationCategory.BACKGROUND_TASK);
            }
        }).start();
    }
}

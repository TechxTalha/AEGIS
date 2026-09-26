package com.aegis.core.task.service;

import com.aegis.core.task.entity.Task;
import com.aegis.core.task.entity.TaskStatus;
import com.aegis.core.task.repository.TaskRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TaskRecoveryService {

    private static final Logger logger = LoggerFactory.getLogger(TaskRecoveryService.class);
    private final TaskRepository taskRepository;

    public TaskRecoveryService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void recoverStuckTasks() {
        logger.info("Checking for stuck tasks that need recovery...");
        
        List<Task> executingTasks = taskRepository.findByStatus(TaskStatus.EXECUTING);
        if (!executingTasks.isEmpty()) {
            logger.warn("Found {} tasks stuck in EXECUTING state due to an improper shutdown. Marking them as FAILED.", executingTasks.size());
            for (Task task : executingTasks) {
                task.setStatus(TaskStatus.FAILED);
                task.setMetadata(appendMetadata(task.getMetadata(), "SYSTEM_ERROR: Task was interrupted by application shutdown."));
                taskRepository.save(task);
            }
        }
    }

    private String appendMetadata(String existing, String addition) {
        if (existing == null || existing.isBlank()) {
            return addition;
        }
        return existing + "\n" + addition;
    }
}

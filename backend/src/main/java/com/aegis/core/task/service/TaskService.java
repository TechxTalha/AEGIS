package com.aegis.core.task.service;

import com.aegis.core.task.dto.CreateTaskRequest;
import com.aegis.core.task.dto.TaskDto;
import com.aegis.core.task.entity.*;
import com.aegis.core.task.repository.EventRepository;
import com.aegis.core.task.exception.InvalidTaskStateException;
import com.aegis.core.task.repository.ExecutionRepository;
import com.aegis.core.task.repository.TaskRepository;
import com.aegis.core.task.websocket.TaskEventPublisher;
import com.aegis.core.user.UserRepository;
import com.aegis.core.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ExecutionRepository executionRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final TaskLifecycleValidator lifecycleValidator;
    private final TaskEventPublisher eventPublisher;

    public TaskService(TaskRepository taskRepository,
                       ExecutionRepository executionRepository,
                       EventRepository eventRepository,
                       UserRepository userRepository,
                       TaskLifecycleValidator lifecycleValidator,
                       TaskEventPublisher eventPublisher) {
        this.taskRepository = taskRepository;
        this.executionRepository = executionRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.lifecycleValidator = lifecycleValidator;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public TaskDto createTask(String username, CreateTaskRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Task task = new Task();
        task.setUser(user);
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        
        if (request.getPriority() != null) {
            try {
                task.setPriority(TaskPriority.valueOf(request.getPriority().toUpperCase()));
            } catch (IllegalArgumentException e) {
                task.setPriority(TaskPriority.NORMAL);
            }
        }
        
        task.setMetadata(request.getMetadata());
        
        Task saved = taskRepository.save(task);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<TaskDto> getUserTasks(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        return taskRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaskDto getTask(Long taskId, String username) {
        return mapToDto(getTaskOrThrow(taskId, username));
    }

    @Transactional(readOnly = true)
    public List<com.aegis.core.task.dto.ExecutionDto> getTaskExecutions(Long taskId, String username) {
        getTaskOrThrow(taskId, username); // Verify ownership
        return executionRepository.findByTaskIdOrderByStartedAtDesc(taskId)
                .stream()
                .map(this::mapToExecutionDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void startTask(Long taskId, String username) {
        Task task = getTaskOrThrow(taskId, username);
        if (task.getStatus() != TaskStatus.CREATED) {
            throw new InvalidTaskStateException("Can only start a task that is in CREATED state");
        }
        lifecycleValidator.validateTransition(task.getStatus(), TaskStatus.EXECUTING);

        task.setStatus(TaskStatus.EXECUTING);
        taskRepository.save(task);

        Execution execution = new Execution();
        execution.setTask(task);
        execution.setStatus(ExecutionStatus.RUNNING);
        execution.setStartedAt(LocalDateTime.now());
        Execution savedExecution = executionRepository.save(execution);

        logEvent(savedExecution, "TASK_STARTED", "Task execution started");
    }

    @Transactional
    public void pauseTask(Long taskId, String username) {
        Task task = getTaskOrThrow(taskId, username);
        if (task.getStatus() != TaskStatus.EXECUTING && task.getStatus() != TaskStatus.PLANNING) {
            throw new InvalidTaskStateException("Can only pause a task that is actively executing");
        }
        lifecycleValidator.validateTransition(task.getStatus(), TaskStatus.WAITING);

        task.setStatus(TaskStatus.WAITING);
        taskRepository.save(task);

        Execution execution = getLatestActiveExecution(taskId);
        if (execution != null) {
            execution.setStatus(ExecutionStatus.PAUSED);
            executionRepository.save(execution);
            logEvent(execution, "TASK_PAUSED", "Task execution paused");
        }
    }

    @Transactional
    public void resumeTask(Long taskId, String username) {
        Task task = getTaskOrThrow(taskId, username);
        if (task.getStatus() != TaskStatus.WAITING && task.getStatus() != TaskStatus.BLOCKED) {
            throw new InvalidTaskStateException("Can only resume a task that is waiting or blocked");
        }
        lifecycleValidator.validateTransition(task.getStatus(), TaskStatus.EXECUTING);

        task.setStatus(TaskStatus.EXECUTING);
        taskRepository.save(task);

        Execution execution = getLatestActiveExecution(taskId);
        if (execution != null) {
            execution.setStatus(ExecutionStatus.RUNNING);
            executionRepository.save(execution);
            logEvent(execution, "TASK_RESUMED", "Task execution resumed");
        }
    }

    @Transactional
    public void completeTask(Long taskId, String username) {
        Task task = getTaskOrThrow(taskId, username);
        lifecycleValidator.validateTransition(task.getStatus(), TaskStatus.COMPLETED);

        task.setStatus(TaskStatus.COMPLETED);
        taskRepository.save(task);

        Execution execution = getLatestActiveExecution(taskId);
        if (execution != null) {
            execution.setStatus(ExecutionStatus.SUCCESS);
            execution.setCompletedAt(LocalDateTime.now());
            executionRepository.save(execution);
            logEvent(execution, "TASK_COMPLETED", "Task successfully completed");
        }
    }

    @Transactional
    public void failTask(Long taskId, String reason, String username) {
        Task task = getTaskOrThrow(taskId, username);
        lifecycleValidator.validateTransition(task.getStatus(), TaskStatus.FAILED);

        task.setStatus(TaskStatus.FAILED);
        taskRepository.save(task);

        Execution execution = getLatestActiveExecution(taskId);
        if (execution != null) {
            execution.setStatus(ExecutionStatus.FAILED);
            execution.setErrorMessage(reason);
            execution.setCompletedAt(LocalDateTime.now());
            executionRepository.save(execution);
            logEvent(execution, "TASK_FAILED", "Task failed: " + reason);
        }
    }

    @Transactional
    public void cancelTask(Long taskId, String username) {
        Task task = getTaskOrThrow(taskId, username);
        lifecycleValidator.validateTransition(task.getStatus(), TaskStatus.CANCELLED);

        task.setStatus(TaskStatus.CANCELLED);
        taskRepository.save(task);

        Execution execution = getLatestActiveExecution(taskId);
        if (execution != null) {
            execution.setStatus(ExecutionStatus.CANCELLED);
            execution.setCompletedAt(LocalDateTime.now());
            executionRepository.save(execution);
        } else {
            execution = new Execution();
            execution.setTask(task);
            execution.setStatus(ExecutionStatus.CANCELLED);
            execution.setCompletedAt(LocalDateTime.now());
            execution = executionRepository.save(execution);
        }
        logEvent(execution, "TASK_CANCELLED", "Task execution cancelled");
    }

    private Task getTaskOrThrow(Long taskId, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found with ID: " + taskId));
        if (!task.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Access denied: You do not own this task");
        }
        return task;
    }

    private Execution getLatestActiveExecution(Long taskId) {
        List<Execution> executions = executionRepository.findByTaskIdOrderByStartedAtDesc(taskId);
        return executions.isEmpty() ? null : executions.get(0);
    }

    private void logEvent(Execution execution, String eventType, String details) {
        Event event = new Event();
        event.setExecution(execution);
        event.setEventType(eventType);
        event.setDetails(details);
        Event saved = eventRepository.save(event);
        
        com.aegis.core.task.dto.EventDto dto = new com.aegis.core.task.dto.EventDto();
        dto.setId(saved.getId());
        dto.setEventType(saved.getEventType());
        dto.setDetails(saved.getDetails());
        dto.setTimestamp(saved.getTimestamp());
        eventPublisher.publishEvent(execution.getTask().getId(), dto);
    }

    private TaskDto mapToDto(Task task) {
        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setStatus(task.getStatus());
        dto.setPriority(task.getPriority());
        dto.setMetadata(task.getMetadata());
        dto.setCreatedAt(task.getCreatedAt());
        dto.setUpdatedAt(task.getUpdatedAt());
        return dto;
    }

    private com.aegis.core.task.dto.ExecutionDto mapToExecutionDto(Execution execution) {
        com.aegis.core.task.dto.ExecutionDto dto = new com.aegis.core.task.dto.ExecutionDto();
        dto.setId(execution.getId());
        dto.setTaskId(execution.getTask().getId());
        dto.setStatus(execution.getStatus());
        dto.setPlan(execution.getPlan());
        dto.setErrorMessage(execution.getErrorMessage());
        dto.setStartedAt(execution.getStartedAt());
        dto.setCompletedAt(execution.getCompletedAt());
        dto.setCreatedAt(execution.getCreatedAt());
        dto.setUpdatedAt(execution.getUpdatedAt());

        java.util.List<com.aegis.core.task.dto.EventDto> eventDtos = eventRepository.findByExecutionIdOrderByTimestampAsc(execution.getId())
                .stream().map(e -> {
                    com.aegis.core.task.dto.EventDto ed = new com.aegis.core.task.dto.EventDto();
                    ed.setId(e.getId());
                    ed.setEventType(e.getEventType());
                    ed.setDetails(e.getDetails());
                    ed.setTimestamp(e.getTimestamp());
                    return ed;
                }).collect(Collectors.toList());
        dto.setEvents(eventDtos);
        return dto;
    }
}

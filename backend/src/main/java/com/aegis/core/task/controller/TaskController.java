package com.aegis.core.task.controller;

import com.aegis.core.task.dto.CreateTaskRequest;
import com.aegis.core.task.dto.TaskDto;
import com.aegis.core.task.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public ResponseEntity<TaskDto> createTask(@Valid @RequestBody CreateTaskRequest request, Authentication authentication) {
        TaskDto task = taskService.createTask(authentication.getName(), request);
        return new ResponseEntity<>(task, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<TaskDto>> getUserTasks(Authentication authentication) {
        List<TaskDto> tasks = taskService.getUserTasks(authentication.getName());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<TaskDto> getTask(@PathVariable Long taskId, Authentication authentication) {
        TaskDto task = taskService.getTask(taskId, authentication.getName());
        return ResponseEntity.ok(task);
    }

    @PostMapping("/{taskId}/start")
    public ResponseEntity<Void> startTask(@PathVariable Long taskId, Authentication authentication) {
        taskService.startTask(taskId, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{taskId}/pause")
    public ResponseEntity<Void> pauseTask(@PathVariable Long taskId, Authentication authentication) {
        taskService.pauseTask(taskId, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{taskId}/resume")
    public ResponseEntity<Void> resumeTask(@PathVariable Long taskId, Authentication authentication) {
        taskService.resumeTask(taskId, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{taskId}/cancel")
    public ResponseEntity<Void> cancelTask(@PathVariable Long taskId, Authentication authentication) {
        taskService.cancelTask(taskId, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{taskId}/complete")
    public ResponseEntity<Void> completeTask(@PathVariable Long taskId, Authentication authentication) {
        taskService.completeTask(taskId, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{taskId}/fail")
    public ResponseEntity<Void> failTask(@PathVariable Long taskId, @RequestParam(required = false, defaultValue = "Manual failure") String reason, Authentication authentication) {
        taskService.failTask(taskId, reason, authentication.getName());
        return ResponseEntity.ok().build();
    }
}

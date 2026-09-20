package com.aegis.core.task.controller;

import com.aegis.core.task.dto.ExecutionDto;
import com.aegis.core.task.entity.Execution;
import com.aegis.core.task.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tasks/{taskId}/executions")
public class ExecutionController {

    private final TaskService taskService;

    public ExecutionController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<ExecutionDto>> getExecutionsForTask(@PathVariable Long taskId, Authentication authentication) {
        List<ExecutionDto> executions = taskService.getTaskExecutions(taskId, authentication.getName());
        return ResponseEntity.ok(executions);
    }
}

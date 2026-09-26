package com.aegis.core.task.service;

import com.aegis.core.task.entity.Task;
import com.aegis.core.task.entity.TaskStatus;
import com.aegis.core.task.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.mockito.Mockito.*;

class TaskRecoveryServiceTest {

    private TaskRepository taskRepository;
    private TaskRecoveryService taskRecoveryService;

    @BeforeEach
    void setUp() {
        taskRepository = mock(TaskRepository.class);
        taskRecoveryService = new TaskRecoveryService(taskRepository);
    }

    @Test
    void testRecoverStuckTasks() {
        Task stuckTask = new Task();
        stuckTask.setId(1L);
        stuckTask.setStatus(TaskStatus.EXECUTING);
        stuckTask.setMetadata("initial data");

        when(taskRepository.findByStatus(TaskStatus.EXECUTING)).thenReturn(List.of(stuckTask));

        taskRecoveryService.recoverStuckTasks();

        verify(taskRepository, times(1)).save(argThat(task -> 
            task.getId().equals(1L) &&
            task.getStatus() == TaskStatus.FAILED &&
            task.getMetadata().contains("SYSTEM_ERROR: Task was interrupted by application shutdown.")
        ));
    }
}

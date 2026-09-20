package com.aegis.core.task.service;

import com.aegis.core.task.dto.CreateTaskRequest;
import com.aegis.core.task.dto.TaskDto;
import com.aegis.core.task.entity.Task;
import com.aegis.core.task.entity.TaskPriority;
import com.aegis.core.task.entity.TaskStatus;
import com.aegis.core.task.repository.TaskRepository;
import com.aegis.core.user.UserRepository;
import com.aegis.core.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TaskService taskService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
    }

    @Test
    void createTask_Success() {
        CreateTaskRequest req = new CreateTaskRequest();
        req.setTitle("Test Task");
        req.setDescription("Desc");
        req.setPriority("HIGH");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        
        Task savedTask = new Task();
        savedTask.setId(100L);
        savedTask.setTitle("Test Task");
        savedTask.setDescription("Desc");
        savedTask.setStatus(TaskStatus.CREATED);
        savedTask.setPriority(TaskPriority.HIGH);
        
        when(taskRepository.save(any(Task.class))).thenReturn(savedTask);

        TaskDto result = taskService.createTask("testuser", req);

        assertNotNull(result);
        assertEquals(100L, result.getId());
        assertEquals("Test Task", result.getTitle());
        assertEquals(TaskPriority.HIGH, result.getPriority());
        assertEquals(TaskStatus.CREATED, result.getStatus());
    }
}

package com.aegis.core.task.service;

import com.aegis.core.task.entity.Task;
import com.aegis.core.task.entity.TaskStatus;
import com.aegis.core.task.exception.InvalidTaskStateException;
import com.aegis.core.task.repository.EventRepository;
import com.aegis.core.task.repository.ExecutionRepository;
import com.aegis.core.task.repository.TaskRepository;
import com.aegis.core.task.websocket.TaskEventPublisher;
import com.aegis.core.user.UserRepository;
import com.aegis.core.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskLifecycleTest {

    @Mock
    private TaskRepository taskRepository;
    @Mock
    private ExecutionRepository executionRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TaskEventPublisher eventPublisher;

    private TaskLifecycleValidator lifecycleValidator;
    private TaskService taskService;
    private User testUser;

    @BeforeEach
    void setUp() {
        lifecycleValidator = new TaskLifecycleValidator();
        taskService = new TaskService(taskRepository, executionRepository, eventRepository, userRepository, lifecycleValidator, eventPublisher);
        
        lenient().when(executionRepository.save(any())).thenAnswer(i -> {
            com.aegis.core.task.entity.Execution e = i.getArgument(0);
            if (e.getId() == null) e.setId(System.currentTimeMillis());
            return e;
        });
        
        lenient().when(eventRepository.save(any())).thenAnswer(i -> {
            com.aegis.core.task.entity.Event e = i.getArgument(0);
            if (e.getId() == null) e.setId(System.currentTimeMillis());
            if (e.getTimestamp() == null) e.setTimestamp(java.time.LocalDateTime.now());
            return e;
        });

        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
    }

    @Test
    void testValidStartTransition() {
        Task task = new Task();
        task.setId(1L);
        task.setUser(testUser);
        task.setStatus(TaskStatus.CREATED);
        
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        
        taskService.startTask(1L, "testuser");
        
        verify(taskRepository, times(1)).save(task);
        verify(executionRepository, times(1)).save(any());
        verify(eventRepository, times(1)).save(any());
    }

    @Test
    void testInvalidStartTransitionThrowsException() {
        Task task = new Task();
        task.setId(1L);
        task.setUser(testUser);
        task.setStatus(TaskStatus.COMPLETED);
        
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        
        assertThrows(InvalidTaskStateException.class, () -> {
            taskService.startTask(1L, "testuser");
        });
    }

    @Test
    void testValidPauseTransition() {
        Task task = new Task();
        task.setId(1L);
        task.setUser(testUser);
        task.setStatus(TaskStatus.EXECUTING);
        
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(executionRepository.findByTaskIdOrderByStartedAtDesc(1L)).thenReturn(Collections.emptyList());
        
        taskService.pauseTask(1L, "testuser");
        
        verify(taskRepository, times(1)).save(task);
    }
    
    @Test
    void testAccessDeniedForDifferentUser() {
        Task task = new Task();
        task.setId(1L);
        task.setUser(testUser);
        task.setStatus(TaskStatus.CREATED);
        
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        
        assertThrows(RuntimeException.class, () -> {
            taskService.startTask(1L, "malicioususer");
        }, "Access denied: You do not own this task");
    }
}

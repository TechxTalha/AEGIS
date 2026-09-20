package com.aegis.core.task.service;

import com.aegis.core.task.entity.TaskStatus;
import com.aegis.core.task.exception.InvalidTaskStateException;
import org.springframework.stereotype.Component;

@Component
public class TaskLifecycleValidator {

    public void validateTransition(TaskStatus current, TaskStatus next) {
        boolean isValid = false;

        switch (current) {
            case CREATED:
                isValid = (next == TaskStatus.EXECUTING || next == TaskStatus.CANCELLED || next == TaskStatus.PLANNING);
                break;
            case PLANNING:
            case WAITING_FOR_APPROVAL:
            case VERIFYING:
                isValid = (next == TaskStatus.EXECUTING || next == TaskStatus.CANCELLED || next == TaskStatus.FAILED);
                break;
            case EXECUTING:
                isValid = (next == TaskStatus.WAITING || next == TaskStatus.BLOCKED || 
                           next == TaskStatus.COMPLETED || next == TaskStatus.FAILED || next == TaskStatus.CANCELLED);
                break;
            case WAITING:
            case BLOCKED:
                isValid = (next == TaskStatus.EXECUTING || next == TaskStatus.CANCELLED);
                break;
            case COMPLETED:
            case FAILED:
            case CANCELLED:
                // Terminal states cannot transition to anything else
                isValid = false;
                break;
        }

        if (!isValid) {
            throw new InvalidTaskStateException("Cannot transition task from " + current + " to " + next);
        }
    }
}

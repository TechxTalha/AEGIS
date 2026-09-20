package com.aegis.core.task.entity;

public enum TaskStatus {
    CREATED,
    PLANNING,
    WAITING_FOR_APPROVAL,
    EXECUTING,
    WAITING,
    BLOCKED,
    VERIFYING,
    COMPLETED,
    FAILED,
    CANCELLED
}

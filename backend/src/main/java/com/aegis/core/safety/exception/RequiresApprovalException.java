package com.aegis.core.safety.exception;

import com.aegis.core.safety.model.ApprovalRequest;

public class RequiresApprovalException extends RuntimeException {
    private final ApprovalRequest approvalRequest;

    public RequiresApprovalException(String message, ApprovalRequest approvalRequest) {
        super(message);
        this.approvalRequest = approvalRequest;
    }

    public ApprovalRequest getApprovalRequest() {
        return approvalRequest;
    }
}

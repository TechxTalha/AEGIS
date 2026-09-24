package com.aegis.core.safety.service;

import com.aegis.core.safety.exception.RequiresApprovalException;
import com.aegis.core.safety.model.ApprovalRequest;
import com.aegis.core.safety.model.ApprovalStatus;
import com.aegis.core.tool.model.ToolInvocation;
import com.aegis.core.tool.model.ToolDefinition;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ExecutionSafetyService {
    private final SecurityPolicy securityPolicy;
    private final ConcurrentHashMap<String, ApprovalRequest> pendingRequests = new ConcurrentHashMap<>();

    public ExecutionSafetyService(SecurityPolicy securityPolicy) {
        this.securityPolicy = securityPolicy;
    }

    public void evaluateInvocation(String planStepId, ToolInvocation invocation, ToolDefinition definition) {
        // Check if there is already an APPROVED or REJECTED request for this exact step, tool, and parameters
        java.util.Optional<ApprovalRequest> existingRequest = pendingRequests.values().stream()
                .filter(req -> req.getPlanStepId().equals(planStepId) &&
                        req.getToolId().equals(invocation.getToolId()) &&
                        java.util.Objects.equals(req.getParameters(), invocation.getParameters()))
                .findFirst();

        if (existingRequest.isPresent()) {
            ApprovalRequest req = existingRequest.get();
            if (req.getStatus() == ApprovalStatus.APPROVED && req.getExpirationTimestamp().isAfter(Instant.now())) {
                return; // Proceed
            } else if (req.getStatus() == ApprovalStatus.REJECTED) {
                throw new SecurityException("Tool execution was explicitly rejected by user for tool: " + invocation.getToolId());
            }
            // If pending or expired, we will just create a new one below or overwrite, 
            // but realistically we should just return or throw RequiresApprovalException again.
            // For simplicity, if it's PENDING, throw again.
            if (req.getStatus() == ApprovalStatus.PENDING) {
                throw new RequiresApprovalException("Tool execution requires explicit approval due to risk level: " + definition.getRiskLevel(), req);
            }
        }

        if (securityPolicy.requiresApproval(definition.getRiskLevel(), definition.getId())) {
            ApprovalRequest request = new ApprovalRequest();
            request.setId(UUID.randomUUID().toString());
            request.setPlanStepId(planStepId);
            request.setToolId(invocation.getToolId());
            request.setParameters(invocation.getParameters());
            request.setExpirationTimestamp(Instant.now().plus(1, ChronoUnit.HOURS));
            
            pendingRequests.put(request.getId(), request);
            throw new RequiresApprovalException("Tool execution requires explicit approval due to risk level: " + definition.getRiskLevel(), request);
        }
    }

    public void approveRequest(String requestId) {
        ApprovalRequest request = pendingRequests.get(requestId);
        if (request != null) {
            request.setStatus(ApprovalStatus.APPROVED);
        }
    }

    public void rejectRequest(String requestId) {
        ApprovalRequest request = pendingRequests.get(requestId);
        if (request != null) {
            request.setStatus(ApprovalStatus.REJECTED);
        }
    }
    
    public ApprovalRequest getRequest(String requestId) {
        return pendingRequests.get(requestId);
    }
}

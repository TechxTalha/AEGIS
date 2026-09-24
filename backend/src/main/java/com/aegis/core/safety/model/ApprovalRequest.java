package com.aegis.core.safety.model;

import java.time.Instant;
import java.util.Map;

public class ApprovalRequest {
    private String id;
    private String planStepId;
    private String toolId;
    private Map<String, Object> parameters;
    private ApprovalStatus status = ApprovalStatus.PENDING;
    private Instant expirationTimestamp;

    public ApprovalRequest() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPlanStepId() { return planStepId; }
    public void setPlanStepId(String planStepId) { this.planStepId = planStepId; }

    public String getToolId() { return toolId; }
    public void setToolId(String toolId) { this.toolId = toolId; }

    public Map<String, Object> getParameters() { return parameters; }
    public void setParameters(Map<String, Object> parameters) { this.parameters = parameters; }

    public ApprovalStatus getStatus() { return status; }
    public void setStatus(ApprovalStatus status) { this.status = status; }

    public Instant getExpirationTimestamp() { return expirationTimestamp; }
    public void setExpirationTimestamp(Instant expirationTimestamp) { this.expirationTimestamp = expirationTimestamp; }
}

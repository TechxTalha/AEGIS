package com.aegis.core.verification.model;

public class Evidence {
    private String stepId;
    private String description;
    private String result;

    public Evidence() {}

    public Evidence(String stepId, String description, String result) {
        this.stepId = stepId;
        this.description = description;
        this.result = result;
    }

    public String getStepId() { return stepId; }
    public void setStepId(String stepId) { this.stepId = stepId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
}

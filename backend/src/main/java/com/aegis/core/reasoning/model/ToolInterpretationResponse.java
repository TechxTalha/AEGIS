package com.aegis.core.reasoning.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ToolInterpretationResponse {
    private boolean success;
    private String insights;
    private String nextRecommendedAction;

    public ToolInterpretationResponse() {}

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getInsights() { return insights; }
    public void setInsights(String insights) { this.insights = insights; }
    public String getNextRecommendedAction() { return nextRecommendedAction; }
    public void setNextRecommendedAction(String nextRecommendedAction) { this.nextRecommendedAction = nextRecommendedAction; }
}

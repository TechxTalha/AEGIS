package com.aegis.core.planning.model;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Plan {
    private String id;
    private String objective;
    private PlanStatus status = PlanStatus.PENDING;
    private List<PlanStep> steps = new ArrayList<>();

    public Plan() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getObjective() { return objective; }
    public void setObjective(String objective) { this.objective = objective; }
    public PlanStatus getStatus() { return status; }
    public void setStatus(PlanStatus status) { this.status = status; }
    public List<PlanStep> getSteps() { return steps; }
    public void setSteps(List<PlanStep> steps) { this.steps = steps != null ? steps : new ArrayList<>(); }
}

package com.aegis.core.monitoring.model;

public class MonitorCondition {
    private String id;
    private String metric;
    private double threshold;
    private String operator; // e.g. ">", "<", "=="
    private String actionObjective;

    public MonitorCondition() {}

    public MonitorCondition(String id, String metric, double threshold, String operator, String actionObjective) {
        this.id = id;
        this.metric = metric;
        this.threshold = threshold;
        this.operator = operator;
        this.actionObjective = actionObjective;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMetric() { return metric; }
    public void setMetric(String metric) { this.metric = metric; }

    public double getThreshold() { return threshold; }
    public void setThreshold(double threshold) { this.threshold = threshold; }

    public String getOperator() { return operator; }
    public void setOperator(String operator) { this.operator = operator; }

    public String getActionObjective() { return actionObjective; }
    public void setActionObjective(String actionObjective) { this.actionObjective = actionObjective; }
}

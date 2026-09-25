package com.aegis.core.monitoring.model;

import java.time.LocalDateTime;

public class MonitorAlert {
    private String alertId;
    private String conditionId;
    private String metric;
    private double value;
    private LocalDateTime timestamp;

    public MonitorAlert() {}

    public MonitorAlert(String alertId, String conditionId, String metric, double value, LocalDateTime timestamp) {
        this.alertId = alertId;
        this.conditionId = conditionId;
        this.metric = metric;
        this.value = value;
        this.timestamp = timestamp;
    }

    public String getAlertId() { return alertId; }
    public void setAlertId(String alertId) { this.alertId = alertId; }

    public String getConditionId() { return conditionId; }
    public void setConditionId(String conditionId) { this.conditionId = conditionId; }

    public String getMetric() { return metric; }
    public void setMetric(String metric) { this.metric = metric; }

    public double getValue() { return value; }
    public void setValue(double value) { this.value = value; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}

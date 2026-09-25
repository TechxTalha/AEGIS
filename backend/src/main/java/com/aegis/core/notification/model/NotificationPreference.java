package com.aegis.core.notification.model;

import java.util.List;

public class NotificationPreference {
    private NotificationPriority priorityThreshold;
    private List<String> enabledSinks;

    public NotificationPreference() {}

    public NotificationPreference(NotificationPriority priorityThreshold, List<String> enabledSinks) {
        this.priorityThreshold = priorityThreshold;
        this.enabledSinks = enabledSinks;
    }

    public NotificationPriority getPriorityThreshold() { return priorityThreshold; }
    public void setPriorityThreshold(NotificationPriority priorityThreshold) { this.priorityThreshold = priorityThreshold; }

    public List<String> getEnabledSinks() { return enabledSinks; }
    public void setEnabledSinks(List<String> enabledSinks) { this.enabledSinks = enabledSinks; }
}

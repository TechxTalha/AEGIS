package com.aegis.core.notification.sink;

import com.aegis.core.notification.model.AegisNotification;

public interface NotificationSink {
    String getSinkId();
    void send(AegisNotification notification);
}

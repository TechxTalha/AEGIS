package com.aegis.core.model.gateway.exception;

public class RateLimitException extends ModelGatewayException {
    private final long retryAfterMs;

    public RateLimitException(String message, long retryAfterMs) {
        super(message);
        this.retryAfterMs = retryAfterMs;
    }

    public long getRetryAfterMs() { return retryAfterMs; }
}

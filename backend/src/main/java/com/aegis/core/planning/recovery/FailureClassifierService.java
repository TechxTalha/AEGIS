package com.aegis.core.planning.recovery;

import com.aegis.core.tool.model.ToolResult;
import org.springframework.stereotype.Service;

@Service
public class FailureClassifierService {

    public FailureType classify(Throwable exception) {
        if (exception == null) {
            return FailureType.TERMINAL;
        }

        String message = exception.getMessage() != null ? exception.getMessage().toLowerCase() : "";

        if (message.contains("timeout") || message.contains("connection reset") || message.contains("rate limit")) {
            return FailureType.TRANSIENT;
        }

        if (message.contains("permission denied") || message.contains("unauthorized") || message.contains("forbidden")) {
            return FailureType.REQUIRES_HUMAN;
        }

        // If not transient or purely human, let's allow replanning by default for unknown exceptions
        // so the AI can try another approach
        return FailureType.REQUIRES_REPLANNING;
    }

    public FailureType classify(ToolResult result) {
        if (result == null || result.isSuccess()) {
            return FailureType.TERMINAL;
        }

        String output = result.getPayload() != null ? result.getPayload().toLowerCase() : "";
        String error = result.getErrorMessage() != null ? result.getErrorMessage().toLowerCase() : "";
        String combined = output + " " + error;

        if (combined.contains("timeout") || combined.contains("connection reset") || combined.contains("rate limit") || combined.contains("network is unreachable")) {
            return FailureType.TRANSIENT;
        }

        if (combined.contains("permission denied") || combined.contains("access denied") || combined.contains("unauthorized") || combined.contains("forbidden")) {
            return FailureType.REQUIRES_HUMAN;
        }

        // Default to replanning to let the AI try a different tool or parameters
        return FailureType.REQUIRES_REPLANNING;
    }
}

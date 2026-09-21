package com.aegis.core.tool.model;

public enum RiskLevel {
    LOW,      // Read-only operations, safe to execute automatically
    MEDIUM,   // Minor modifications or side-effects, generally safe
    HIGH,     // Destructive or impactful operations, might require approval
    CRITICAL  // System-altering or highly sensitive operations, strict approval required
}

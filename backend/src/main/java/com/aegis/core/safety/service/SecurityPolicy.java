package com.aegis.core.safety.service;

import com.aegis.core.tool.model.RiskLevel;

public interface SecurityPolicy {
    boolean requiresApproval(RiskLevel riskLevel, String toolId);
}

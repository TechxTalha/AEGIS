package com.aegis.core.safety.service;

import com.aegis.core.tool.model.RiskLevel;
import org.springframework.stereotype.Component;

@Component
public class DefaultSecurityPolicy implements SecurityPolicy {
    @Override
    public boolean requiresApproval(RiskLevel riskLevel, String toolId) {
        if (riskLevel == null) return false;
        return riskLevel == RiskLevel.HIGH || riskLevel == RiskLevel.CRITICAL;
    }
}

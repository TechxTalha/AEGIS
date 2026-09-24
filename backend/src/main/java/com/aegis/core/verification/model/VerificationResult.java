package com.aegis.core.verification.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.ArrayList;

@JsonIgnoreProperties(ignoreUnknown = true)
public class VerificationResult {
    private boolean verified;
    private String reasoning;
    private List<String> discrepancies = new ArrayList<>();

    public VerificationResult() {}

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public String getReasoning() { return reasoning; }
    public void setReasoning(String reasoning) { this.reasoning = reasoning; }

    public List<String> getDiscrepancies() { return discrepancies; }
    public void setDiscrepancies(List<String> discrepancies) { 
        this.discrepancies = discrepancies != null ? discrepancies : new ArrayList<>(); 
    }
}

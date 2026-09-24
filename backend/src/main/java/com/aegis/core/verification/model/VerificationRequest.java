package com.aegis.core.verification.model;

import java.util.List;

public class VerificationRequest {
    private String objective;
    private List<Evidence> evidenceList;

    public VerificationRequest() {}

    public String getObjective() { return objective; }
    public void setObjective(String objective) { this.objective = objective; }

    public List<Evidence> getEvidenceList() { return evidenceList; }
    public void setEvidenceList(List<Evidence> evidenceList) { this.evidenceList = evidenceList; }
}

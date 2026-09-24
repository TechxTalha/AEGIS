package com.aegis.core.reasoning.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ToolSelectionResponse {
    private String selectedToolId;
    private Map<String, Object> parameters;
    private String rationale;

    public ToolSelectionResponse() {}

    public String getSelectedToolId() { return selectedToolId; }
    public void setSelectedToolId(String selectedToolId) { this.selectedToolId = selectedToolId; }
    public Map<String, Object> getParameters() { return parameters; }
    public void setParameters(Map<String, Object> parameters) { this.parameters = parameters != null ? parameters : new java.util.HashMap<>(); }
    public String getRationale() { return rationale; }
    public void setRationale(String rationale) { this.rationale = rationale; }
}

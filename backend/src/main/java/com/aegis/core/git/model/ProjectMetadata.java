package com.aegis.core.git.model;

import java.util.List;

public class ProjectMetadata {
    private String projectType;
    private String buildCommand;
    private String testCommand;
    private List<String> detectedFiles;

    public ProjectMetadata() {}

    public ProjectMetadata(String projectType, String buildCommand, String testCommand, List<String> detectedFiles) {
        this.projectType = projectType;
        this.buildCommand = buildCommand;
        this.testCommand = testCommand;
        this.detectedFiles = detectedFiles;
    }

    public String getProjectType() { return projectType; }
    public void setProjectType(String projectType) { this.projectType = projectType; }
    public String getBuildCommand() { return buildCommand; }
    public void setBuildCommand(String buildCommand) { this.buildCommand = buildCommand; }
    public String getTestCommand() { return testCommand; }
    public void setTestCommand(String testCommand) { this.testCommand = testCommand; }
    public List<String> getDetectedFiles() { return detectedFiles; }
    public void setDetectedFiles(List<String> detectedFiles) { this.detectedFiles = detectedFiles; }
}

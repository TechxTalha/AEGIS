package com.aegis.core.memory.context;

import com.aegis.core.git.model.ProjectMetadata;
import com.aegis.core.git.service.ProjectAnalyzerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ProjectContextProvider implements ContextProvider {
    private static final Logger logger = LoggerFactory.getLogger(ProjectContextProvider.class);

    private final ProjectAnalyzerService projectAnalyzerService;

    public ProjectContextProvider(ProjectAnalyzerService projectAnalyzerService) {
        this.projectAnalyzerService = projectAnalyzerService;
    }

    @Override
    public String getContextName() {
        return "Project Context";
    }

    @Override
    public String buildContext() {
        try {
            // Assume current directory is the project directory for AEGIS agent context
            String userDir = System.getProperty("user.dir");
            ProjectMetadata metadata = projectAnalyzerService.analyzeProject(userDir);
            
            StringBuilder sb = new StringBuilder();
            sb.append("Project Type: ").append(metadata.getProjectType()).append("\n");
            sb.append("Detected Setup Files: ").append(metadata.getDetectedFiles()).append("\n");
            sb.append("Suggested Build Command: ").append(metadata.getBuildCommand()).append("\n");
            sb.append("Suggested Test Command: ").append(metadata.getTestCommand()).append("\n");
            
            return sb.toString();
        } catch (Exception e) {
            logger.error("Failed to load project context", e);
            return "Project context unavailable: " + e.getMessage();
        }
    }
}

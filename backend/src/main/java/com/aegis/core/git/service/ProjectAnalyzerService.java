package com.aegis.core.git.service;

import com.aegis.core.git.model.ProjectMetadata;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProjectAnalyzerService {

    public ProjectMetadata analyzeProject(String path) {
        File dir = new File(path);
        if (!dir.exists() || !dir.isDirectory()) {
            throw new IllegalArgumentException("Invalid path: " + path);
        }

        ProjectMetadata metadata = new ProjectMetadata();
        metadata.setDetectedFiles(new ArrayList<>());

        boolean hasPom = new File(dir, "pom.xml").exists();
        boolean hasPackageJson = new File(dir, "package.json").exists();
        boolean hasBuildGradle = new File(dir, "build.gradle").exists();
        boolean hasRequirementsTxt = new File(dir, "requirements.txt").exists();
        boolean hasGoMod = new File(dir, "go.mod").exists();

        if (hasPom) {
            metadata.getDetectedFiles().add("pom.xml");
            metadata.setProjectType("Java (Maven)");
            if (new File(dir, "mvnw").exists()) {
                metadata.setBuildCommand("./mvnw clean install");
                metadata.setTestCommand("./mvnw test");
            } else {
                metadata.setBuildCommand("mvn clean install");
                metadata.setTestCommand("mvn test");
            }
        } else if (hasBuildGradle) {
            metadata.getDetectedFiles().add("build.gradle");
            metadata.setProjectType("Java (Gradle)");
            if (new File(dir, "gradlew").exists()) {
                metadata.setBuildCommand("./gradlew build");
                metadata.setTestCommand("./gradlew test");
            } else {
                metadata.setBuildCommand("gradle build");
                metadata.setTestCommand("gradle test");
            }
        } else if (hasPackageJson) {
            metadata.getDetectedFiles().add("package.json");
            metadata.setProjectType("Node.js");
            metadata.setBuildCommand("npm install");
            metadata.setTestCommand("npm test");
        } else if (hasRequirementsTxt) {
            metadata.getDetectedFiles().add("requirements.txt");
            metadata.setProjectType("Python");
            metadata.setBuildCommand("pip install -r requirements.txt");
            metadata.setTestCommand("pytest");
        } else if (hasGoMod) {
            metadata.getDetectedFiles().add("go.mod");
            metadata.setProjectType("Go");
            metadata.setBuildCommand("go build");
            metadata.setTestCommand("go test ./...");
        } else {
            metadata.setProjectType("Unknown");
            metadata.setBuildCommand("");
            metadata.setTestCommand("");
        }

        return metadata;
    }
}

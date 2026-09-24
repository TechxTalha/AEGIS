package com.aegis.core.git.service;

import com.aegis.core.git.model.ProjectMetadata;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProjectAnalyzerServiceTest {

    private final ProjectAnalyzerService service = new ProjectAnalyzerService();

    @Test
    void testAnalyzeCurrentProject() {
        ProjectMetadata metadata = service.analyzeProject(".");
        assertNotNull(metadata);
        assertEquals("Java (Maven)", metadata.getProjectType());
    }

    @Test
    void testInvalidPath() {
        assertThrows(IllegalArgumentException.class, () -> {
            service.analyzeProject("/path/does/not/exist");
        });
    }
}

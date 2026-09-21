package com.aegis.core.tool.registry;

import com.aegis.core.tool.model.ToolDefinition;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class InMemoryToolRegistryTest {

    private InMemoryToolRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new InMemoryToolRegistry();
    }

    @Test
    void registerAndGetTool() {
        ToolDefinition def = new ToolDefinition();
        def.setId("test.tool");
        def.setName("Test Tool");
        def.setRiskLevel(com.aegis.core.tool.model.RiskLevel.LOW);
        def.setStatus(com.aegis.core.tool.model.ToolStatus.ACTIVE);
        
        registry.registerTool(def);
        
        Optional<ToolDefinition> retrieved = registry.getTool("test.tool");
        assertTrue(retrieved.isPresent());
        assertEquals("Test Tool", retrieved.get().getName());
    }

    @Test
    void registerToolWithNullId_ShouldThrowException() {
        ToolDefinition def = new ToolDefinition();
        // ID is null
        assertThrows(IllegalArgumentException.class, () -> registry.registerTool(def));
    }

    @Test
    void discoverToolsByCapability() {
        ToolDefinition def1 = new ToolDefinition();
        def1.setId("sys.read");
        def1.setName("File Reader");
        def1.setDescription("Reads files from the system");
        def1.setRiskLevel(com.aegis.core.tool.model.RiskLevel.LOW);
        def1.setStatus(com.aegis.core.tool.model.ToolStatus.ACTIVE);
        registry.registerTool(def1);

        ToolDefinition def2 = new ToolDefinition();
        def2.setId("sys.write");
        def2.setName("File Writer");
        def2.setRiskLevel(com.aegis.core.tool.model.RiskLevel.MEDIUM);
        def2.setStatus(com.aegis.core.tool.model.ToolStatus.ACTIVE);
        def2.setCapabilityMetadata(Map.of("tag", "filesystem"));
        registry.registerTool(def2);

        // Search by name/desc
        List<ToolDefinition> results1 = registry.discoverToolsByCapability("read");
        assertEquals(1, results1.size());
        assertEquals("sys.read", results1.get(0).getId());

        // Search by metadata tag
        List<ToolDefinition> results2 = registry.discoverToolsByCapability("filesystem");
        assertEquals(1, results2.size());
        assertEquals("sys.write", results2.get(0).getId());

        // Search by partial match (case insensitive)
        List<ToolDefinition> results3 = registry.discoverToolsByCapability("FILE");
        assertEquals(2, results3.size());
    }
}

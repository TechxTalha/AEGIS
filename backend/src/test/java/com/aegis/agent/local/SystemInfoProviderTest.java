package com.aegis.agent.local;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.*;

class SystemInfoProviderTest {

    private SystemInfoProvider provider;
    private ObjectMapper mapper;
    private AgentAuditLogger mockLogger;

    @BeforeEach
    void setUp() {
        mockLogger = Mockito.mock(AgentAuditLogger.class);
        provider = new SystemInfoProvider(mockLogger);
        mapper = new ObjectMapper();
    }

    @Test
    void testGetMemoryInfo() throws Exception {
        String memoryInfo = provider.getMemoryInfo("test-agent");
        assertNotNull(memoryInfo);
        JsonNode node = mapper.readTree(memoryInfo);
        assertTrue(node.has("total"));
        assertTrue(node.has("available"));
        assertTrue(node.has("used"));
    }

    @Test
    void testGetCpuInfo() throws Exception {
        String cpuInfo = provider.getCpuInfo("test-agent");
        assertNotNull(cpuInfo);
        JsonNode node = mapper.readTree(cpuInfo);
        assertTrue(node.has("logicalCoreCount"));
        assertTrue(node.has("physicalCoreCount"));
        assertTrue(node.has("modelName"));
    }

    @Test
    void testGetProcessesInfo() throws Exception {
        String processesInfo = provider.getProcessesInfo("test-agent");
        assertNotNull(processesInfo);
        JsonNode node = mapper.readTree(processesInfo);
        assertTrue(node.isArray());
        // The system should have at least one process running
        if (node.size() > 0) {
            JsonNode pNode = node.get(0);
            assertTrue(pNode.has("pid"));
            assertTrue(pNode.has("name"));
            assertTrue(pNode.has("cpuUsage"));
            assertTrue(pNode.has("memoryUsage"));
            assertTrue(pNode.has("state"));
        }
    }

    @Test
    void testGetDiskInfo() throws Exception {
        String diskInfo = provider.getDiskInfo("test-agent");
        assertNotNull(diskInfo);
        JsonNode node = mapper.readTree(diskInfo);
        assertTrue(node.isArray());
    }

    @Test
    void testGetNetworkInfo() throws Exception {
        String networkInfo = provider.getNetworkInfo("test-agent");
        assertNotNull(networkInfo);
        JsonNode node = mapper.readTree(networkInfo);
        assertTrue(node.isArray());
    }

    @Test
    void testGetServicesInfo() throws Exception {
        String servicesInfo = provider.getServicesInfo("test-agent");
        assertNotNull(servicesInfo);
        JsonNode node = mapper.readTree(servicesInfo);
        assertTrue(node.isArray());
    }
}

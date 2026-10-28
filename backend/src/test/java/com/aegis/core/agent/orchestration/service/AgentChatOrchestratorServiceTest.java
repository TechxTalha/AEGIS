package com.aegis.core.agent.orchestration.service;

import com.aegis.agent.local.CommandExecutor;
import com.aegis.agent.local.SystemInfoProvider;
import com.aegis.core.database.service.DatabaseConnectionService;
import com.aegis.core.memory.longterm.domain.MemoryNode;
import com.aegis.core.memory.longterm.service.LongTermMemoryService;
import com.aegis.core.model.gateway.dto.ModelRequest;
import com.aegis.core.model.gateway.dto.ModelResponse;
import com.aegis.core.model.gateway.service.ModelGatewayService;
import com.aegis.core.task.dto.CreateTaskRequest;
import com.aegis.core.task.dto.TaskDto;
import com.aegis.core.task.entity.TaskPriority;
import com.aegis.core.task.repository.TaskRepository;
import com.aegis.core.task.service.TaskService;
import com.aegis.core.web.model.WebSearchResult;
import com.aegis.core.web.service.WebResearchService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class AgentChatOrchestratorServiceTest {

    private ModelGatewayService modelGatewayService;
    private SystemInfoProvider systemInfoProvider;
    private WebResearchService webResearchService;
    private LongTermMemoryService longTermMemoryService;
    private TaskService taskService;
    private TaskRepository taskRepository;
    private CommandExecutor commandExecutor;
    private DatabaseConnectionService databaseConnectionService;
    private DataSource dataSource;
    private ObjectMapper objectMapper;
    private AgentChatOrchestratorService orchestratorService;

    @BeforeEach
    void setUp() {
        modelGatewayService = mock(ModelGatewayService.class);
        systemInfoProvider = mock(SystemInfoProvider.class);
        webResearchService = mock(WebResearchService.class);
        longTermMemoryService = mock(LongTermMemoryService.class);
        taskService = mock(TaskService.class);
        taskRepository = mock(TaskRepository.class);
        commandExecutor = mock(CommandExecutor.class);
        databaseConnectionService = mock(DatabaseConnectionService.class);
        dataSource = mock(DataSource.class);
        objectMapper = new ObjectMapper();

        orchestratorService = new AgentChatOrchestratorService(
            modelGatewayService,
            systemInfoProvider,
            webResearchService,
            longTermMemoryService,
            taskService,
            taskRepository,
            commandExecutor,
            databaseConnectionService,
            dataSource,
            objectMapper
        );
    }

    private ModelResponse resp(String content) {
        ModelResponse r = new ModelResponse();
        r.setContent(content);
        return r;
    }

    @Test
    void testIdentityRecognition_Hunter() {
        Map<String, Object> resp = orchestratorService.processUserMessage("Hunter", "Aegis, who am I?", null);
        assertNotNull(resp);
        String reply = (String) resp.get("reply");
        assertTrue(reply.contains("creator") && reply.contains("Hunter"), "Identity reply must acknowledge Hunter as creator");
        assertEquals("CONVERSATION", resp.get("action"));
        verifyNoInteractions(modelGatewayService);
    }

    @Test
    void testDirectTool_MemoryTelemetry() {
        String reasoningJson = "{\n" +
            "  \"action\": \"DIRECT_TOOL\",\n" +
            "  \"tool\": \"SYS_INFO\",\n" +
            "  \"parameters\": { \"type\": \"memory\" }\n" +
            "}";
        String synthesisReply = "Host telemetry reports 2.1 GB used out of 8.0 GB total, Hunter.";

        when(modelGatewayService.generate(any(ModelRequest.class)))
            .thenReturn(resp(reasoningJson))
            .thenReturn(resp(synthesisReply));

        when(systemInfoProvider.getMemoryInfo("chat-orchestrator"))
            .thenReturn("{\"total\": 8589934592, \"available\": 6442450944, \"used\": 2147483648}");

        Map<String, Object> result = orchestratorService.processUserMessage("Hunter", "Check our free RAM right now", null);
        assertNotNull(result);
        assertEquals("DIRECT_TOOL", result.get("action"));
        assertEquals("SYS_INFO", result.get("tool"));
        assertEquals(synthesisReply, result.get("reply"));
        verify(systemInfoProvider).getMemoryInfo("chat-orchestrator");
    }

    @Test
    void testDirectTool_WebSearch() {
        String reasoningJson = "{\n" +
            "  \"action\": \"DIRECT_TOOL\",\n" +
            "  \"tool\": \"WEB_SEARCH\",\n" +
            "  \"parameters\": { \"query\": \"Spring Boot 3.5 release date\" }\n" +
            "}";
        String synthesisReply = "Spring Boot 3.5 release is scheduled with enhanced virtual thread management, Hunter.";

        when(modelGatewayService.generate(any(ModelRequest.class)))
            .thenReturn(resp(reasoningJson))
            .thenReturn(resp(synthesisReply));

        when(webResearchService.search("Spring Boot 3.5 release date"))
            .thenReturn(List.of(new WebSearchResult("Spring Boot 3.5", "https://spring.io", "GA release planned soon.")));

        Map<String, Object> result = orchestratorService.processUserMessage("Hunter", "Search web for Spring Boot 3.5 release date", null);
        assertNotNull(result);
        assertEquals("DIRECT_TOOL", result.get("action"));
        assertEquals("WEB_SEARCH", result.get("tool"));
        assertEquals(synthesisReply, result.get("reply"));
        verify(webResearchService).search("Spring Boot 3.5 release date");
    }

    @Test
    void testDirectTool_LongTermMemoryStore() {
        String reasoningJson = "{\n" +
            "  \"action\": \"DIRECT_TOOL\",\n" +
            "  \"tool\": \"MEMORY_STORE\",\n" +
            "  \"parameters\": { \"category\": \"preference\", \"content\": \"Hunter prefers PostgreSQL over MySQL\" }\n" +
            "}";
        String synthesisReply = "Understood, Hunter. I have committed your preference for PostgreSQL to permanent neural memory.";

        when(modelGatewayService.generate(any(ModelRequest.class)))
            .thenReturn(resp(reasoningJson))
            .thenReturn(resp(synthesisReply));

        MemoryNode node = new MemoryNode();
        node.setId(UUID.randomUUID());
        node.setCategory("preference");
        node.setContent("Hunter prefers PostgreSQL over MySQL");
        when(longTermMemoryService.saveMemory("preference", "Hunter prefers PostgreSQL over MySQL")).thenReturn(node);

        Map<String, Object> result = orchestratorService.processUserMessage("Hunter", "Remember that I prefer PostgreSQL over MySQL", null);
        assertNotNull(result);
        assertEquals("DIRECT_TOOL", result.get("action"));
        assertEquals("MEMORY_STORE", result.get("tool"));
        verify(longTermMemoryService).saveMemory("preference", "Hunter prefers PostgreSQL over MySQL");
    }

    @Test
    void testCreateTask_AutonomousLaunch() {
        String reasoningJson = "{\n" +
            "  \"action\": \"CREATE_TASK\",\n" +
            "  \"parameters\": {\n" +
            "    \"title\": \"Vulnerability Audit on Backend Dependencies\",\n" +
            "    \"description\": \"Scan all pom.xml dependencies for known CVEs and produce remediation plan.\",\n" +
            "    \"priority\": \"HIGH\"\n" +
            "  }\n" +
            "}";

        when(modelGatewayService.generate(any(ModelRequest.class))).thenReturn(resp(reasoningJson));

        TaskDto mockCreated = new TaskDto();
        mockCreated.setId(99L);
        mockCreated.setTitle("Vulnerability Audit on Backend Dependencies");
        mockCreated.setPriority(TaskPriority.HIGH);

        when(taskService.createTask(eq("Hunter"), any(CreateTaskRequest.class))).thenReturn(mockCreated);

        Map<String, Object> result = orchestratorService.processUserMessage("Hunter", "Can you run a vulnerability audit on our backend dependencies?", null);
        assertNotNull(result);
        assertEquals("CREATE_TASK", result.get("action"));
        String reply = (String) result.get("reply");
        assertTrue(reply.contains("Task #99") && reply.contains("HIGH"), "Must confirm task creation and launch");
        verify(taskService).createTask(eq("Hunter"), any(CreateTaskRequest.class));
        verify(taskService).startTask(99L, "Hunter");
    }

    @Test
    void testConversation_GeneralDialogue() {
        String reasoningJson = "{\n" +
            "  \"action\": \"CONVERSATION\",\n" +
            "  \"conversationalReply\": \"Quantum key distribution guarantees cryptographic security by utilizing the no-cloning theorem, Hunter.\"\n" +
            "}";

        when(modelGatewayService.generate(any(ModelRequest.class))).thenReturn(resp(reasoningJson));

        Map<String, Object> result = orchestratorService.processUserMessage("Hunter", "How does quantum key distribution work?", null);
        assertNotNull(result);
        assertEquals("CONVERSATION", result.get("action"));
        assertEquals("neural-gateway", result.get("provider"));
        assertTrue(((String) result.get("reply")).contains("Quantum key distribution"));
    }

    @Test
    void testFailSafe_WhenModelGatewayThrows() {
        when(modelGatewayService.generate(any(ModelRequest.class))).thenThrow(new RuntimeException("Gateway network timeout"));
        when(systemInfoProvider.getMemoryInfo("chat-fallback"))
            .thenReturn("{\"total\": 8589934592, \"available\": 4294967296, \"used\": 4294967296}");

        Map<String, Object> result = orchestratorService.processUserMessage("Hunter", "Check host RAM usage", null);
        assertNotNull(result);
        assertEquals("DIRECT_TOOL", result.get("action"));
        assertEquals("SYS_INFO", result.get("tool"));
        assertTrue(((String) result.get("reply")).contains("Host memory telemetry"));
    }
}

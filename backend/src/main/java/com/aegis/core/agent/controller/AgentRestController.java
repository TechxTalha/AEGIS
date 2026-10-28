package com.aegis.core.agent.controller;

import com.aegis.agent.local.SystemInfoProvider;
import com.aegis.core.agent.server.AgentInfo;
import com.aegis.core.agent.server.AgentManager;
import com.aegis.core.model.gateway.dto.ModelMessage;
import com.aegis.core.model.gateway.dto.ModelRequest;
import com.aegis.core.model.gateway.dto.ModelResponse;
import com.aegis.core.model.gateway.service.ModelGatewayService;
import com.aegis.core.task.dto.CreateTaskRequest;
import com.aegis.core.task.dto.TaskDto;
import com.aegis.core.task.entity.Task;
import com.aegis.core.task.entity.TaskStatus;
import com.aegis.core.task.repository.TaskRepository;
import com.aegis.core.task.service.TaskService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.aegis.core.agent.orchestration.service.AgentChatOrchestratorService;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/agents")
public class AgentRestController {

    private static final Logger logger = LoggerFactory.getLogger(AgentRestController.class);

    private final AgentManager agentManager;
    private final TaskRepository taskRepository;
    private final TaskService taskService;
    private final SystemInfoProvider systemInfoProvider;
    private final ModelGatewayService modelGatewayService;
    private final RestTemplate restTemplate;
    private final AgentChatOrchestratorService agentChatOrchestratorService;
    private final ObjectMapper objectMapper;

    @org.springframework.beans.factory.annotation.Autowired
    public AgentRestController(AgentManager agentManager,
                               TaskRepository taskRepository,
                               @Lazy TaskService taskService,
                               SystemInfoProvider systemInfoProvider,
                               @Lazy ModelGatewayService modelGatewayService,
                               @Lazy RestTemplate restTemplate,
                               @Lazy AgentChatOrchestratorService agentChatOrchestratorService) {
        this.agentManager = agentManager;
        this.taskRepository = taskRepository;
        this.taskService = taskService;
        this.systemInfoProvider = systemInfoProvider;
        this.modelGatewayService = modelGatewayService;
        this.restTemplate = restTemplate != null ? restTemplate : new RestTemplate();
        this.agentChatOrchestratorService = agentChatOrchestratorService;
        this.objectMapper = new ObjectMapper();
    }

    public AgentRestController(AgentManager agentManager,
                               TaskRepository taskRepository,
                               SystemInfoProvider systemInfoProvider) {
        this(agentManager, taskRepository, null, systemInfoProvider, null, null, null);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getLiveAgents(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();

        // 1. Gather real hardware telemetry
        double realCpuPct = 12.0;
        String memoryUsage = "3.2 GB / 8.0 GB";
        long totalMemoryBytes = 0;
        long usedMemoryBytes = 0;

        try {
            String memJson = systemInfoProvider.getMemoryInfo("api-telemetry");
            JsonNode memNode = objectMapper.readTree(memJson);
            long total = memNode.path("total").asLong(0);
            long available = memNode.path("available").asLong(0);
            long used = total - available;
            totalMemoryBytes = total;
            usedMemoryBytes = used;
            if (total > 0) {
                double memPct = (used * 100.0) / total;
                memoryUsage = String.format("%.1f GB / %.1f GB (%.0f%%)", 
                    used / (1024.0 * 1024.0 * 1024.0), 
                    total / (1024.0 * 1024.0 * 1024.0), 
                    memPct);
            }
        } catch (Exception e) {
            logger.warn("Could not query real memory: {}", e.getMessage());
        }

        // 2. Check for actively executing tasks
        List<Task> runningTasks = taskRepository.findByStatus(TaskStatus.EXECUTING);
        if (runningTasks.isEmpty()) {
            runningTasks = taskRepository.findByStatus(TaskStatus.PLANNING);
        }
        if (runningTasks.isEmpty()) {
            runningTasks = taskRepository.findByStatus(TaskStatus.VERIFYING);
        }
        boolean isTaskRunning = !runningTasks.isEmpty();
        Task activeTask = isTaskRunning ? runningTasks.get(0) : null;
        String activeTaskTitle = activeTask != null ? activeTask.getTitle() : null;

        // 3. Assemble canonical plan agents (3 Workstation Wings + 1 Grand Recreation Lounge)
        List<Map<String, Object>> agentsList = new ArrayList<>();

        // Agent 1: AEGIS Core Orchestrator -> Master Command Bridge
        Map<String, Object> coreAgent = new HashMap<>();
        coreAgent.put("id", "agent-core-1");
        coreAgent.put("name", "AEGIS Core Orchestrator");
        coreAgent.put("role", "Mission Lead & System Orchestrator");
        coreAgent.put("type", "System");
        coreAgent.put("status", isTaskRunning ? "BUSY" : "ONLINE");
        coreAgent.put("homeDeck", "bridge");
        coreAgent.put("room", "bridge");
        coreAgent.put("currentTask", isTaskRunning ? "Executing: " + activeTaskTitle : "Command bridge synchronized");
        coreAgent.put("cpu", isTaskRunning ? 68 : 14);
        coreAgent.put("memory", memoryUsage);
        coreAgent.put("capabilities", Arrays.asList("plan", "execute", "reason", "orchestrate"));
        coreAgent.put("drink", "Espresso");
        coreAgent.put("persona", Map.of(
            "outfitColor", "#00d2ff",
            "hairColor", "#1e293b",
            "accessory", "headset",
            "title", "Commander"
        ));
        agentsList.add(coreAgent);

        // Agent 2: Database Agent -> Data & Radar Wing (SQL Section)
        Map<String, Object> dbAgent = new HashMap<>();
        dbAgent.put("id", "agent-db-worker");
        dbAgent.put("name", "Database Agent");
        dbAgent.put("role", "Data Architect & SQL Engine");
        dbAgent.put("type", "Specialized");
        dbAgent.put("status", isTaskRunning ? "BUSY" : "ONLINE");
        dbAgent.put("homeDeck", "data_radar");
        dbAgent.put("room", "data_radar");
        dbAgent.put("currentTask", isTaskRunning ? "Indexing execution records" : "Database connection pool active");
        dbAgent.put("cpu", isTaskRunning ? 38 : 11);
        dbAgent.put("memory", "1.8 GB allocated");
        dbAgent.put("capabilities", Arrays.asList("sql.read", "sql.write", "schema.analyze", "indexing"));
        dbAgent.put("drink", "Green Tea");
        dbAgent.put("persona", Map.of(
            "outfitColor", "#10b981",
            "hairColor", "#064e3b",
            "accessory", "datapad",
            "title", "Archivist"
        ));
        agentsList.add(dbAgent);

        // Agent 3: Web Research Agent -> Data & Radar Wing (Radar Section)
        Map<String, Object> researchAgent = new HashMap<>();
        researchAgent.put("id", "agent-research-1");
        researchAgent.put("name", "Web Research Agent");
        researchAgent.put("role", "Realtime Web & API Explorer");
        researchAgent.put("type", "Specialized");
        researchAgent.put("status", "ONLINE");
        researchAgent.put("homeDeck", "data_radar");
        researchAgent.put("room", "data_radar");
        researchAgent.put("currentTask", "Global network scanner standby");
        researchAgent.put("cpu", 8);
        researchAgent.put("memory", "2.4 GB allocated");
        researchAgent.put("capabilities", Arrays.asList("web.search", "web.scrape", "doc.parse"));
        researchAgent.put("drink", "Iced Latte");
        researchAgent.put("persona", Map.of(
            "outfitColor", "#f59e0b",
            "hairColor", "#78350f",
            "accessory", "goggles",
            "title", "Scout"
        ));
        agentsList.add(researchAgent);

        // Agent 4: Antigravity Coder -> Quantum Synthesis Lab
        Map<String, Object> coderAgent = new HashMap<>();
        coderAgent.put("id", "agent-coder-x");
        coderAgent.put("name", "Antigravity Coder");
        coderAgent.put("role", "Autonomous Code Synthesis");
        coderAgent.put("type", "External");
        coderAgent.put("status", "OFFLINE");
        coderAgent.put("homeDeck", "quantum_lab");
        coderAgent.put("room", "quantum_lab");
        coderAgent.put("currentTask", "Pod Hibernation (Recreation Bay)");
        coderAgent.put("cpu", 0);
        coderAgent.put("memory", "0 GB");
        coderAgent.put("capabilities", Arrays.asList("fs.write", "git.commit", "ide.edit", "lint.fix"));
        coderAgent.put("drink", "None");
        coderAgent.put("persona", Map.of(
            "outfitColor", "#a855f7",
            "hairColor", "#4c1d95",
            "accessory", "hoodie",
            "title", "Hacker"
        ));
        agentsList.add(coderAgent);

        response.put("agents", agentsList);
        response.put("timestamp", System.currentTimeMillis());
        response.put("activeTask", activeTaskTitle);
        response.put("isExecuting", isTaskRunning);
        response.put("hostMemory", memoryUsage);
        response.put("houseStats", Map.of(
            "workingCount", agentsList.stream().filter(a -> "BUSY".equals(a.get("status"))).count(),
            "idleCount", agentsList.stream().filter(a -> "ONLINE".equals(a.get("status"))).count(),
            "offlineCount", agentsList.stream().filter(a -> "OFFLINE".equals(a.get("status"))).count()
        ));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chatWithAgent(@RequestBody Map<String, Object> requestBody, Authentication authentication) {
        String message = requestBody.get("message") != null ? String.valueOf(requestBody.get("message")).trim() : null;
        if (message == null || message.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty"));
        }

        String username = authentication != null && authentication.getName() != null ? authentication.getName() : "Hunter";
        
        if (agentChatOrchestratorService != null) {
            Map<String, Object> result = agentChatOrchestratorService.processUserMessage(username, message, requestBody.get("history"));
            return ResponseEntity.ok(result);
        }

        Map<String, Object> fallback = new HashMap<>();
        fallback.put("reply", "Standing by, Hunter. Core systems operational.");
        fallback.put("provider", "system");
        fallback.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(fallback);
    }
}

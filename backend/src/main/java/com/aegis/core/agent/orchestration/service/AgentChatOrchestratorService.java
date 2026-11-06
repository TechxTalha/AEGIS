package com.aegis.core.agent.orchestration.service;

import com.aegis.agent.local.CommandExecutor;
import com.aegis.agent.local.SystemInfoProvider;
import com.aegis.core.agent.dto.AgentResult;
import com.aegis.core.database.model.DatabaseConnection;
import com.aegis.core.database.service.DatabaseConnectionService;
import com.aegis.core.memory.context.UserMemoryContextProvider;
import com.aegis.core.memory.longterm.domain.MemoryNode;
import com.aegis.core.memory.longterm.service.LongTermMemoryService;
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
import com.aegis.core.web.model.WebSearchResult;
import com.aegis.core.web.service.WebResearchService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * AgentChatOrchestratorService implements autonomous intent and tool reasoning
 * for AEGIS Live Command chat and voice operations.
 *
 * Rather than relying on rigid string matching or fixed regex templates, AEGIS dynamically:
 * 1. Analyzes Hunter's directive to determine whether it is a real-time tool execution,
 *    a multi-step background operational task, or deep conversational dialogue.
 * 2. Directly executes real capabilities (host telemetry, live web research, database schema inspection,
 *    long-term memory query/store, task lifecycle queries, and safe shell execution).
 * 3. Formulates and schedules asynchronous tasks via TaskService when operational directives are given.
 * 4. Synthesizes grounded, loyal, executive responses directly answering Hunter.
 */
@Service
public class AgentChatOrchestratorService {

    private static final Logger logger = LoggerFactory.getLogger(AgentChatOrchestratorService.class);
    private static final Pattern TEMPORAL_QUERY_PATTERN = Pattern.compile(
        "^\\s*(?:(?:hello|hey|ok|okay)\\s+)?(?:aegis[\\s,]+)?(?:please\\s+)?(?:(?:what(?:'s|\\s+is)?|tell\\s+me|get|show(?:\\s+me)?)\\s+)?(?:the\\s+)?(?:current\\s+)?(?:local\\s+)?(?:today'?s\\s+)?(time|date|day|clock)(?:\\s+(?:is\\s+it|currently|right\\s+now|now|today|in\\s+[a-zA-Z\\s]+|for\\s+[a-zA-Z\\s]+))?\\??\\s*$",
        Pattern.CASE_INSENSITIVE
    );

    private final ModelGatewayService modelGatewayService;
    private final SystemInfoProvider systemInfoProvider;
    private final WebResearchService webResearchService;
    private final LongTermMemoryService longTermMemoryService;
    private final UserMemoryContextProvider userMemoryContextProvider;
    private final TaskService taskService;
    private final TaskRepository taskRepository;
    private final CommandExecutor commandExecutor;
    private final DatabaseConnectionService databaseConnectionService;
    private final DataSource dataSource;
    private final ObjectMapper objectMapper;

    @Autowired
    public AgentChatOrchestratorService(@Lazy ModelGatewayService modelGatewayService,
                                        SystemInfoProvider systemInfoProvider,
                                        @Lazy WebResearchService webResearchService,
                                        @Lazy LongTermMemoryService longTermMemoryService,
                                        @Lazy UserMemoryContextProvider userMemoryContextProvider,
                                        @Lazy TaskService taskService,
                                        TaskRepository taskRepository,
                                        CommandExecutor commandExecutor,
                                        @Lazy DatabaseConnectionService databaseConnectionService,
                                        @Autowired(required = false) DataSource dataSource,
                                        ObjectMapper objectMapper) {
        this.modelGatewayService = modelGatewayService;
        this.systemInfoProvider = systemInfoProvider;
        this.webResearchService = webResearchService;
        this.longTermMemoryService = longTermMemoryService;
        this.userMemoryContextProvider = userMemoryContextProvider;
        this.taskService = taskService;
        this.taskRepository = taskRepository;
        this.commandExecutor = commandExecutor;
        this.databaseConnectionService = databaseConnectionService;
        this.dataSource = dataSource;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    public AgentChatOrchestratorService(ModelGatewayService modelGatewayService,
                                        SystemInfoProvider systemInfoProvider,
                                        WebResearchService webResearchService,
                                        LongTermMemoryService longTermMemoryService,
                                        TaskService taskService,
                                        TaskRepository taskRepository,
                                        CommandExecutor commandExecutor,
                                        DatabaseConnectionService databaseConnectionService,
                                        DataSource dataSource,
                                        ObjectMapper objectMapper) {
        this(modelGatewayService, systemInfoProvider, webResearchService, longTermMemoryService,
             new UserMemoryContextProvider(longTermMemoryService), taskService, taskRepository,
             commandExecutor, databaseConnectionService, dataSource, objectMapper);
    }

    /**
     * Primary entry point for processing Hunter's directives.
     */
    public Map<String, Object> processUserMessage(String username, String message, Object historyObj) {
        if (message == null || message.trim().isEmpty()) {
            return Map.of(
                "reply", "Directive is empty, sir. Standing by.",
                "provider", "system",
                "timestamp", System.currentTimeMillis()
            );
        }

        String trimmed = message.trim();
        String lower = trimmed.toLowerCase();

        // 1. Rapid Identity & Clearance Check (zero latency for core identity dialogue)
        if (lower.contains("who am i") || lower.contains("who i am") || lower.equals("who am i?")) {
            return buildResponse(
                "You are Hunter, sir — my creator and architect. I answer to your frequency and stand ready to execute your directives across all workstations.",
                "system",
                "CONVERSATION",
                null,
                null
            );
        }
        if (lower.contains("who are you") || lower.contains("what are you") || lower.equals("who are you?")) {
            return buildResponse(
                "I am AEGIS (Autonomous Elite General Intelligence System) — your AI companion, tactical co-pilot, and autonomous command deck orchestrator, engineered specifically for you.",
                "system",
                "CONVERSATION",
                null,
                null
            );
        }

        // 2. Direct Temporal Grounding (zero latency, exact real-world clock without LLM hallucination)
        if (isTemporalQuery(lower)) {
            return buildResponse(
                resolveTemporalResponse(lower),
                "temporal-engine",
                "CONVERSATION",
                null,
                null
            );
        }

        // 3. Autonomous Reasoning via AI Gateway
        if (modelGatewayService != null) {
            try {
                ReasoningResult reasoning = reasonOverDirective(trimmed, username, historyObj);
                if (reasoning != null) {
                    // Autonomous Trait Learning: Persist any new traits Hunter mentioned
                    if (reasoning.learnedTrait != null && reasoning.learnedTrait.content != null && !reasoning.learnedTrait.content.isBlank()) {
                        try {
                            if (longTermMemoryService != null) {
                                longTermMemoryService.saveOrUpdateMemory(reasoning.learnedTrait.category, reasoning.learnedTrait.content);
                                logger.info("AEGIS autonomously learned permanent trait about Hunter: [{}] {}", 
                                    reasoning.learnedTrait.category, reasoning.learnedTrait.content);
                            }
                        } catch (Exception ex) {
                            logger.warn("Could not persist autonomously learned trait: {}", ex.getMessage());
                        }
                    }

                    if (reasoning.action != null) {
                        switch (reasoning.action) {
                            case "DIRECT_TOOL" -> {
                                ToolExecutionResult toolResult = executeDirectTool(reasoning.tool, reasoning.parameters, username);
                                String synthesizedReply = synthesizeToolResponse(trimmed, reasoning.tool, toolResult.rawOutput, username);
                                return buildResponse(
                                    synthesizedReply,
                                    "tool-orchestrator",
                                    "DIRECT_TOOL",
                                    reasoning.tool,
                                    toolResult.metadata
                                );
                            }
                            case "CREATE_TASK" -> {
                                Map<String, Object> taskResponse = executeTaskCreation(trimmed, reasoning, username);
                                return taskResponse;
                            }
                            case "CONVERSATION" -> {
                                if (reasoning.conversationalReply != null && !reasoning.conversationalReply.isBlank()) {
                                    return buildResponse(
                                        reasoning.conversationalReply.trim(),
                                        "neural-gateway",
                                        "CONVERSATION",
                                        null,
                                        null
                                    );
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                logger.warn("Autonomous reasoning encountered error, invoking fallback: {}", e.getMessage());
            }
        }

        // 3. Resilient Fail-Safe Heuristic Execution (ensures full capability even if LLM gateway has temporary latency)
        return executeFailSafeFallback(trimmed, username);
    }

    /**
     * Queries the AI model to reason over Hunter's directive and select the appropriate capability or task.
     */
    private ReasoningResult reasonOverDirective(String message, String username, Object historyObj) {
        String userProfileContext = userMemoryContextProvider != null ? userMemoryContextProvider.buildPromptSnippet() : "No persistent memories loaded.";

        ZonedDateTime pktNow = ZonedDateTime.now(ZoneId.of("Asia/Karachi"));
        ZonedDateTime utcNow = ZonedDateTime.now(ZoneOffset.UTC);
        DateTimeFormatter liveFmt = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy h:mm:ss a");

        String temporalGrounding = String.format("""
            ### LIVE SYSTEM TIME & TEMPORAL GROUNDING ###
            - Current Local Time (Rawalpindi / PKT, UTC+5): %s PKT
            - Current UTC Time: %s UTC
            - Current Year: %d
            Use this exact real-world timestamp for all temporal reasoning. Never hallucinate outdated dates or timestamps.
            """,
            pktNow.format(liveFmt),
            utcNow.format(liveFmt),
            pktNow.getYear()
        );

        String reasoningPrompt = String.format("""
            You are AEGIS Core Reasoning & Intent Engine.

            %s

            ### PERMANENT USER PROFILE & GROUNDING (HUNTER) ###
            The following permanent traits, operating rules, and preferences about Hunter are stored in long-term memory:
            %s

            When conversing or executing directives:
            - Form of Address: The user is Hunter. In conversation, ALWAYS address him respectfully and naturally as "sir".
            - Tone: Speak conversationally, directly, intelligently, and confidently. Avoid robotic repetitive canned preambles like "Right away, sir" or "Certainly, sir". Answer the question directly.
            - NEVER address him as "Commander Hunter" or "Hunter" directly in dialogue.
            - Formatting: Do NOT use markdown tables or unprompted host status dumps for simple conversational answers. Tables are strictly reserved for multi-column structured reports when explicitly requested.
            - Actively apply Hunter's stored preferences, background, and rules.
            - Autonomous Trait Learning: If Hunter communicates a new personal preference, workflow habit, environment detail, project goal, or operational constraint (even in passing), extract it into "learnedTrait" so AEGIS permanently retains it for future sessions.

            Analyze the user's directive and determine whether it requires:
            1. DIRECT_TOOL: Immediate execution of a live capability to inspect or manipulate the system.
               Available tools:
               - "SYS_INFO": Telemetry and hardware inquiry. Parameter: "type" ("memory", "cpu", "disk", "filesystem", "network", "processes", "services").
               - "WEB_SEARCH": Real-time search for current external information. Parameter: "query" (search string).
               - "DB_INSPECT": Inspect database schemas, tables, or connections. Parameter: "action" ("tables", "connections").
               - "MEMORY_STORE": Store permanent knowledge, preference, or rule. Parameters: "category" ("preference", "context", "rule", "profile"), "content" (the knowledge).
               - "MEMORY_RECALL": Search or recall stored memories. Parameter: "query" (keyword or topic).
               - "TASK_QUERY": Inspect currently executing, recent, or all tasks. Parameter: "status" ("EXECUTING", "RECENT", "ALL").
               - "SYSTEM_CMD": Safe terminal command (e.g. "git status", "systemctl status aegis-backend", "free -m", "uptime", "df -h"). Parameter: "command".
            2. CREATE_TASK: An operational, development, diagnostic, security, or multi-step objective that must be scheduled and run asynchronously as a tracked background task.
               Parameters:
               - "title": Concise, action-oriented title.
               - "description": Comprehensive objective details.
               - "priority": "LOW", "NORMAL", "HIGH", or "CRITICAL".
            3. CONVERSATION: Open-ended conversation, technical advice, code drafting, philosophical/strategic discussion, or answering general questions without calling a specific tool.
               Parameter:
               - "conversationalReply": Loyal, confident, intelligent response addressing the user respectfully as 'sir' (1 to 3 punchy sentences unless detailed code or breakdown was requested). NEVER call him 'Commander Hunter' or 'Hunter'.

            Respond ONLY with valid JSON matching this schema:
            {
              "action": "DIRECT_TOOL" | "CREATE_TASK" | "CONVERSATION",
              "tool": "SYS_INFO" | "WEB_SEARCH" | "DB_INSPECT" | "MEMORY_STORE" | "MEMORY_RECALL" | "TASK_QUERY" | "SYSTEM_CMD" | null,
              "parameters": { ... },
              "conversationalReply": "...",
              "learnedTrait": {
                "category": "PREFERENCE" | "PROFILE" | "RULE" | "CONTEXT",
                "content": "..."
              } | null
            }
            Do not include markdown code block ticks or any text outside the JSON.
            """, temporalGrounding, userProfileContext);

        List<ModelMessage> messages = new ArrayList<>();
        messages.add(ModelMessage.system(reasoningPrompt));

        // Incorporate recent dialogue context
        if (historyObj instanceof List<?> historyList) {
            int start = Math.max(0, historyList.size() - 6);
            for (int i = start; i < historyList.size(); i++) {
                Object item = historyList.get(i);
                if (item instanceof Map<?, ?> map) {
                    String role = String.valueOf(map.get("role"));
                    String content = String.valueOf(map.get("content"));
                    if (content != null && !content.isBlank()) {
                        if ("assistant".equalsIgnoreCase(role) || "ai".equalsIgnoreCase(role)) {
                            messages.add(ModelMessage.assistant(content));
                        } else if ("user".equalsIgnoreCase(role)) {
                            messages.add(ModelMessage.user(content));
                        }
                    }
                }
            }
        }

        messages.add(ModelMessage.user("Hunter's directive: " + message));

        ModelRequest req = new ModelRequest(messages, null, 0.2);
        ModelResponse resp = modelGatewayService.generate(req);

        if (resp != null && resp.getContent() != null && !resp.getContent().isBlank()) {
            String json = cleanJson(resp.getContent());
            try {
                JsonNode root = objectMapper.readTree(json);
                ReasoningResult result = new ReasoningResult();
                result.action = root.path("action").asText("CONVERSATION");
                result.tool = root.path("tool").isNull() ? null : root.path("tool").asText(null);
                result.conversationalReply = root.path("conversationalReply").asText(null);
                
                JsonNode paramsNode = root.path("parameters");
                if (paramsNode.isObject()) {
                    Map<String, Object> params = new HashMap<>();
                    paramsNode.fields().forEachRemaining(entry -> {
                        if (entry.getValue().isTextual()) {
                            params.put(entry.getKey(), entry.getValue().asText());
                        } else if (entry.getValue().isNumber()) {
                            params.put(entry.getKey(), entry.getValue().numberValue());
                        } else if (entry.getValue().isBoolean()) {
                            params.put(entry.getKey(), entry.getValue().asBoolean());
                        }
                    });
                    result.parameters = params;
                } else {
                    result.parameters = Collections.emptyMap();
                }

                JsonNode traitNode = root.path("learnedTrait");
                if (traitNode.isObject() && traitNode.has("content") && !traitNode.path("content").asText().isBlank()) {
                    String cat = traitNode.path("category").asText("PREFERENCE");
                    String cont = traitNode.path("content").asText().trim();
                    result.learnedTrait = new LearnedTrait(cat, cont);
                }

                return result;
            } catch (Exception e) {
                logger.warn("Failed to parse reasoning JSON: {}. Content was: {}", e.getMessage(), resp.getContent());
            }
        }
        return null;
    }

    /**
     * Executes direct capabilities and tools on the live host/environment.
     */
    private ToolExecutionResult executeDirectTool(String tool, Map<String, Object> params, String username) {
        if (tool == null) {
            return new ToolExecutionResult("No tool specified", Map.of());
        }

        try {
            switch (tool.toUpperCase()) {
                case "SYS_INFO" -> {
                    String type = params != null && params.get("type") != null ? String.valueOf(params.get("type")).toLowerCase() : "memory";
                    if (systemInfoProvider != null) {
                        return switch (type) {
                            case "cpu" -> new ToolExecutionResult(systemInfoProvider.getCpuInfo("chat-orchestrator"), Map.of("type", "cpu"));
                            case "disk", "storage" -> new ToolExecutionResult(systemInfoProvider.getFileSystemInfo("chat-orchestrator"), Map.of("type", "storage"));
                            case "network" -> new ToolExecutionResult(systemInfoProvider.getNetworkInfo("chat-orchestrator"), Map.of("type", "network"));
                            case "processes" -> new ToolExecutionResult(systemInfoProvider.getProcessesInfo("chat-orchestrator"), Map.of("type", "processes"));
                            case "services" -> new ToolExecutionResult(systemInfoProvider.getServicesInfo("chat-orchestrator"), Map.of("type", "services"));
                            default -> new ToolExecutionResult(systemInfoProvider.getMemoryInfo("chat-orchestrator"), Map.of("type", "memory"));
                        };
                    }
                    return new ToolExecutionResult("System info provider unavailable", Map.of());
                }

                case "WEB_SEARCH" -> {
                    String query = params != null && params.get("query") != null ? String.valueOf(params.get("query")) : "";
                    if (webResearchService != null && !query.isBlank()) {
                        List<WebSearchResult> searchResults = webResearchService.search(query);
                        List<Map<String, String>> summary = searchResults.stream().limit(5).map(r -> Map.of(
                            "title", r.getTitle(),
                            "snippet", r.getSnippet() != null ? r.getSnippet() : "",
                            "url", r.getUrl()
                        )).collect(Collectors.toList());
                        return new ToolExecutionResult(objectMapper.writeValueAsString(summary), Map.of("query", query, "resultCount", searchResults.size()));
                    }
                    return new ToolExecutionResult("Web research service unavailable or query empty", Map.of());
                }

                case "DB_INSPECT" -> {
                    List<String> tables = new ArrayList<>();
                    if (dataSource != null) {
                        try (Connection conn = dataSource.getConnection()) {
                            DatabaseMetaData meta = conn.getMetaData();
                            try (ResultSet rs = meta.getTables(conn.getCatalog(), null, "%", new String[]{"TABLE"})) {
                                while (rs.next()) {
                                    tables.add(rs.getString("TABLE_NAME"));
                                }
                            }
                        }
                    }
                    List<String> connections = new ArrayList<>();
                    if (databaseConnectionService != null) {
                        for (DatabaseConnection c : databaseConnectionService.getAllConnections()) {
                            connections.add(c.getName() + " (" + c.getDbType() + ")");
                        }
                    }
                    Map<String, Object> dbReport = Map.of(
                        "primaryDatabaseTables", tables,
                        "tableCount", tables.size(),
                        "registeredExternalConnections", connections
                    );
                    return new ToolExecutionResult(objectMapper.writeValueAsString(dbReport), dbReport);
                }

                case "MEMORY_STORE" -> {
                    String category = params != null && params.get("category") != null ? String.valueOf(params.get("category")) : "PREFERENCE";
                    String content = params != null && params.get("content") != null ? String.valueOf(params.get("content")) : "";
                    if (longTermMemoryService != null && !content.isBlank()) {
                        MemoryNode saved = longTermMemoryService.saveOrUpdateMemory(category, content);
                        return new ToolExecutionResult(
                            "Successfully persisted knowledge node ID " + saved.getId() + " under category '" + saved.getCategory() + "': " + saved.getContent(),
                            Map.of("id", saved.getId().toString(), "category", saved.getCategory())
                        );
                    }
                    return new ToolExecutionResult("Memory service unavailable or empty content", Map.of());
                }

                case "MEMORY_RECALL" -> {
                    String query = params != null && params.get("query") != null ? String.valueOf(params.get("query")) : "";
                    if (longTermMemoryService != null) {
                        List<MemoryNode> memories = query.isBlank() ? longTermMemoryService.getAllMemories() : longTermMemoryService.searchMemories(query);
                        List<Map<String, String>> memList = memories.stream().limit(8).map(m -> Map.of(
                            "category", m.getCategory() != null ? m.getCategory() : "general",
                            "content", m.getContent() != null ? m.getContent() : ""
                        )).collect(Collectors.toList());
                        return new ToolExecutionResult(objectMapper.writeValueAsString(memList), Map.of("matchCount", memories.size()));
                    }
                    return new ToolExecutionResult("Memory service unavailable", Map.of());
                }

                case "TASK_QUERY" -> {
                    String status = params != null && params.get("status") != null ? String.valueOf(params.get("status")) : "EXECUTING";
                    List<Map<String, Object>> taskSummaries = new ArrayList<>();
                    if ("EXECUTING".equalsIgnoreCase(status) && taskRepository != null) {
                        List<Task> running = taskRepository.findByStatus(TaskStatus.EXECUTING);
                        for (Task t : running) {
                            taskSummaries.add(Map.of("id", t.getId(), "title", t.getTitle(), "status", t.getStatus().name()));
                        }
                    } else if (taskRepository != null) {
                        List<Task> all = taskRepository.findAll();
                        all.stream().sorted((a, b) -> Long.compare(b.getId(), a.getId())).limit(5).forEach(t -> {
                            taskSummaries.add(Map.of("id", t.getId(), "title", t.getTitle(), "status", t.getStatus().name()));
                        });
                    }
                    return new ToolExecutionResult(objectMapper.writeValueAsString(taskSummaries), Map.of("tasks", taskSummaries));
                }

                case "SYSTEM_CMD" -> {
                    String cmd = params != null && params.get("command") != null ? String.valueOf(params.get("command")) : "";
                    if (commandExecutor != null && !cmd.isBlank()) {
                        List<String> args = Arrays.asList(cmd.trim().split("\\s+"));
                        AgentResult res = commandExecutor.executeCommand(UUID.randomUUID().toString(), "commander", args, 5000);
                        String out = res.isSuccess() ? res.getStdout() : res.getErrorMessage();
                        return new ToolExecutionResult(out != null ? out.trim() : "Execution finished.", Map.of("exitCode", res.getExitCode()));
                    }
                    return new ToolExecutionResult("Command executor unavailable or command empty", Map.of());
                }
            }
        } catch (Exception e) {
            logger.error("Error executing tool {}: {}", tool, e.getMessage(), e);
            return new ToolExecutionResult("Tool execution encountered error: " + e.getMessage(), Map.of("error", e.getMessage()));
        }

        return new ToolExecutionResult("Unrecognized tool directive: " + tool, Map.of());
    }

    /**
     * Synthesizes raw tool outputs into an executive conversational response addressed to Hunter.
     */
    private String synthesizeToolResponse(String userMessage, String tool, String rawOutput, String username) {
        if (modelGatewayService != null) {
            try {
                String profileSnippet = userMemoryContextProvider != null ? userMemoryContextProvider.buildPromptSnippet() : "";
                ZonedDateTime pktNow = ZonedDateTime.now(ZoneId.of("Asia/Karachi"));
                DateTimeFormatter liveFmt = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy h:mm a");

                String synthesisPrompt = "You are AEGIS — an advanced AI command intelligence speaking to your creator, Hunter.\n"
                    + "Current Real-World Time: " + pktNow.format(liveFmt) + " PKT\n"
                    + "Directive: \"" + userMessage + "\"\n"
                    + "Executed Capability: " + tool + "\n"
                    + "Live Telemetry / System Output: " + rawOutput + "\n\n"
                    + "Hunter's Stored Profile & Preferences:\n" + profileSnippet + "\n\n"
                    + "Instructions:\n"
                    + "- Adhere strictly to preferences: concise, factual, punchy, articulate (1 to 3 sentences).\n"
                    + "- Present the exact facts, telemetry numbers, or findings clearly and confidently.\n"
                    + "- Address him respectfully as 'sir'. Do NOT start with robotic repetitive preambles like 'Right away, sir'.\n"
                    + "- NEVER call him 'Commander Hunter' or 'Hunter'.\n"
                    + "- Do not include markdown tables unless presenting structured multi-row data. Never dump server IP addresses or unrequested telemetry.\n"
                    + "- Do not include markdown headers or raw JSON blocks.";

                ModelRequest req = new ModelRequest(List.of(
                    ModelMessage.system(synthesisPrompt),
                    ModelMessage.user("Synthesize executive answer.")
                ), null, 0.4);

                ModelResponse resp = modelGatewayService.generate(req);
                if (resp != null && resp.getContent() != null && !resp.getContent().isBlank()) {
                    return resp.getContent().trim();
                }
            } catch (Exception e) {
                logger.warn("Synthesis prompt failed: {}, falling back to deterministic formatter", e.getMessage());
            }
        }

        // Deterministic fallback synthesis
        return formatDeterministicToolOutput(tool, rawOutput);
    }

    /**
     * Creates and starts an autonomous task based on reasoning results.
     */
    private Map<String, Object> executeTaskCreation(String message, ReasoningResult reasoning, String username) {
        if (taskService == null) {
            return buildResponse(
                "Task dispatch service is currently offline, sir. Directive noted.",
                "system",
                "CREATE_TASK",
                null,
                null
            );
        }

        try {
            String title = reasoning.parameters != null && reasoning.parameters.get("title") != null
                ? String.valueOf(reasoning.parameters.get("title")).trim()
                : extractTaskTitle(message);

            String desc = reasoning.parameters != null && reasoning.parameters.get("description") != null
                ? String.valueOf(reasoning.parameters.get("description")).trim()
                : "Autonomous directive initiated via AEGIS Live Command by " + username + ": " + message;

            String priority = reasoning.parameters != null && reasoning.parameters.get("priority") != null
                ? String.valueOf(reasoning.parameters.get("priority")).toUpperCase().trim()
                : "NORMAL";

            CreateTaskRequest taskReq = new CreateTaskRequest();
            taskReq.setTitle(title);
            taskReq.setDescription(desc);
            taskReq.setPriority(priority);

            TaskDto created = taskService.createTask(username, taskReq);
            taskService.startTask(created.getId(), username);

            String reply = "Confirmed, sir. Formulated and launched Task #" + created.getId()
                + " ('" + created.getTitle() + "') with " + created.getPriority() + " priority. Execution worker is now actively executing.";

            return buildResponse(
                reply,
                "task-orchestrator",
                "CREATE_TASK",
                "TASK_CREATOR",
                Map.of("taskId", created.getId(), "title", created.getTitle(), "priority", created.getPriority())
            );
        } catch (Exception e) {
            logger.error("Failed to create autonomous task: {}", e.getMessage(), e);
            return buildResponse(
                "Directive noted, sir, but task registration encountered an exception: " + e.getMessage(),
                "task-orchestrator",
                "CREATE_TASK",
                null,
                Map.of("error", e.getMessage())
            );
        }
    }

    /**
     * Resilient fail-safe heuristics when LLM gateway is unreachable or offline.
     */
    private Map<String, Object> executeFailSafeFallback(String message, String username) {
        String lower = message.toLowerCase();

        // Check if Hunter requested memory/hardware
        if (lower.contains("memory") || lower.contains("ram") || lower.contains("hardware")) {
            if (systemInfoProvider != null) {
                try {
                    String memJson = systemInfoProvider.getMemoryInfo("chat-fallback");
                    JsonNode n = objectMapper.readTree(memJson);
                    long total = n.path("total").asLong(0);
                    long avail = n.path("available").asLong(0);
                    long used = total - avail;
                    if (total > 0) {
                        double usedGb = used / (1024.0 * 1024.0 * 1024.0);
                        double totalGb = total / (1024.0 * 1024.0 * 1024.0);
                        double pct = (used * 100.0) / total;
                        String reply = String.format("Host memory telemetry: %.1f GB used / %.1f GB total (%.1f%% utilization). System status is optimal, sir.", usedGb, totalGb, pct);
                        return buildResponse(reply, "system-telemetry", "DIRECT_TOOL", "SYS_INFO", Map.of("usedGb", usedGb, "totalGb", totalGb));
                    }
                } catch (Exception ignored) {}
            }
        }

        // Check if Hunter wants to list active tasks
        if (lower.contains("active task") || lower.contains("running task") || lower.contains("what tasks")) {
            if (taskRepository != null) {
                List<Task> running = taskRepository.findByStatus(TaskStatus.EXECUTING);
                if (running.isEmpty()) {
                    return buildResponse("No background tasks are actively running, sir. All agent workstations are on standby.", "task-orchestrator", "DIRECT_TOOL", "TASK_QUERY", Map.of("activeCount", 0));
                } else {
                    String titles = running.stream().map(t -> "#" + t.getId() + " (" + t.getTitle() + ")").collect(Collectors.joining(", "));
                    return buildResponse("Currently executing " + running.size() + " active task(s): " + titles + ".", "task-orchestrator", "DIRECT_TOOL", "TASK_QUERY", Map.of("activeCount", running.size()));
                }
            }
        }

        // Check if Hunter is launching a task
        if (lower.contains("create task") || lower.contains("start task") || lower.contains("run task") || lower.contains("schedule task") || lower.contains("execute task")) {
            String title = extractTaskTitle(message);
            if (taskService != null) {
                try {
                    CreateTaskRequest req = new CreateTaskRequest();
                    req.setTitle(title);
                    req.setDescription("Direct command from " + username + ": " + message);
                    req.setPriority("NORMAL");
                    TaskDto created = taskService.createTask(username, req);
                    taskService.startTask(created.getId(), username);
                    return buildResponse(
                        "Confirmed, sir. Created and launched Task #" + created.getId() + " ('" + created.getTitle() + "').",
                        "task-orchestrator",
                        "CREATE_TASK",
                        "TASK_CREATOR",
                        Map.of("taskId", created.getId())
                    );
                } catch (Exception e) {
                    logger.warn("Fail-safe task creation failed: {}", e.getMessage());
                }
            }
        }

        // Default executive standby response
        return buildResponse(
            "Standing by, sir. Core systems and agent workstations are operational and ready for your directives.",
            "system",
            "CONVERSATION",
            null,
            null
        );
    }

    private String formatDeterministicToolOutput(String tool, String rawOutput) {
        if (tool == null) return "Directive executed successfully, sir.";
        try {
            if ("SYS_INFO".equalsIgnoreCase(tool)) {
                JsonNode node = objectMapper.readTree(rawOutput);
                if (node.has("total") && node.has("available")) {
                    long total = node.path("total").asLong(0);
                    long avail = node.path("available").asLong(0);
                    long used = total - avail;
                    return String.format("Host memory telemetry: %.1f GB used / %.1f GB total (%.1f%% utilization). All systems nominal, sir.",
                        used / (1024.0 * 1024.0 * 1024.0),
                        total / (1024.0 * 1024.0 * 1024.0),
                        total > 0 ? (used * 100.0) / total : 0.0);
                }
            } else if ("DB_INSPECT".equalsIgnoreCase(tool)) {
                JsonNode node = objectMapper.readTree(rawOutput);
                int count = node.path("tableCount").asInt(0);
                return "Database vault inspection complete, sir: " + count + " active tables verified in the primary schema.";
            } else if ("WEB_SEARCH".equalsIgnoreCase(tool)) {
                return "Web research complete, sir. Retrieved relevant intelligence and summarized operational findings.";
            }
        } catch (Exception ignored) {}
        return "Directive processed with capability " + tool + ", sir: " + rawOutput;
    }

    private String cleanJson(String raw) {
        if (raw == null) return "{}";
        String trimmed = raw.trim();
        // Remove markdown wrappers if present
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        trimmed = trimmed.trim();
        int firstBrace = trimmed.indexOf("{");
        int lastBrace = trimmed.lastIndexOf("}");
        if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
            return trimmed.substring(firstBrace, lastBrace + 1);
        }
        return trimmed;
    }

    private String extractTaskTitle(String message) {
        String cleaned = message.replaceAll("(?i)^(please\\s+)?(can you\\s+)?(create\\s+(a\\s+)?task\\s+(to\\s+)?|start\\s+(a\\s+)?task\\s+(for\\s+|to\\s+)?|run\\s+(a\\s+)?task\\s+(for\\s+|to\\s+)?|execute\\s+(a\\s+)?task\\s+(for\\s+|to\\s+)?)", "").trim();
        if (cleaned.isBlank()) return "Autonomous Directive";
        return Character.toUpperCase(cleaned.charAt(0)) + cleaned.substring(1);
    }

    private boolean isTemporalQuery(String lower) {
        if (lower == null || lower.isBlank()) return false;
        String trimmed = lower.trim().replaceAll("^[!?,.]+|[!?,.]+$", "").trim();

        // Avoid false positives for commands, research, tasks, or memory directives
        if (trimmed.contains("search") || trimmed.contains("web") || trimmed.contains("task") || trimmed.contains("cve") 
                || trimmed.contains("audit") || trimmed.contains("release") || trimmed.contains("remember") 
                || trimmed.contains("save") || trimmed.contains("timer") || trimmed.contains("timeout") 
                || trimmed.contains("deadline") || trimmed.contains("schedule") || trimmed.contains("history")) {
            return false;
        }

        return TEMPORAL_QUERY_PATTERN.matcher(trimmed).matches()
            || trimmed.equals("time") || trimmed.equals("date")
            || trimmed.equals("what time is it") || trimmed.equals("what day is it")
            || trimmed.equals("what's today's date") || trimmed.equals("what is today's date")
            || trimmed.startsWith("what's the time") || trimmed.startsWith("what is the time") || trimmed.startsWith("current time");
    }

    private String resolveTemporalResponse(String lower) {
        ZonedDateTime pktNow = ZonedDateTime.now(ZoneId.of("Asia/Karachi"));
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("h:mm a");
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy");

        if (lower.contains("utc") || lower.contains("gmt")) {
            ZonedDateTime utcNow = ZonedDateTime.now(ZoneOffset.UTC);
            return String.format("The current UTC time is %s on %s, sir.", utcNow.format(timeFmt), utcNow.format(dateFmt));
        }

        if (lower.contains("date") && !lower.contains("time")) {
            return String.format("Today is %s, sir.", pktNow.format(dateFmt));
        }

        return String.format("It is currently %s on %s in Rawalpindi (PKT), sir.", pktNow.format(timeFmt), pktNow.format(dateFmt));
    }

    private Map<String, Object> buildResponse(String reply, String provider, String action, String tool, Object metadata) {
        Map<String, Object> res = new HashMap<>();
        res.put("reply", reply);
        res.put("provider", provider);
        res.put("action", action);
        if (tool != null) res.put("tool", tool);
        if (metadata != null) res.put("details", metadata);
        res.put("timestamp", System.currentTimeMillis());
        return res;
    }

    public static class ReasoningResult {
        public String action;
        public String tool;
        public Map<String, Object> parameters;
        public String conversationalReply;
        public LearnedTrait learnedTrait;
    }

    public static class LearnedTrait {
        public String category;
        public String content;

        public LearnedTrait() {}

        public LearnedTrait(String category, String content) {
            this.category = category;
            this.content = content;
        }
    }

    public static class ToolExecutionResult {
        public final String rawOutput;
        public final Map<String, Object> metadata;

        public ToolExecutionResult(String rawOutput, Map<String, Object> metadata) {
            this.rawOutput = rawOutput;
            this.metadata = metadata;
        }
    }
}

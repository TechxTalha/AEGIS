package com.aegis.core.web.service;

import com.aegis.core.tool.executor.ToolExecutionEngine;
import com.aegis.core.tool.executor.ToolExecutor;
import com.aegis.core.tool.model.RiskLevel;
import com.aegis.core.tool.model.ToolDefinition;
import com.aegis.core.tool.model.ToolInvocation;
import com.aegis.core.tool.model.ToolResult;
import com.aegis.core.tool.registry.ToolRegistry;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

@Service
public class WebToolRegistrar {

    private final ToolRegistry toolRegistry;
    private final ToolExecutionEngine toolExecutionEngine;
    private final WebResearchService webResearchService;
    private final ObjectMapper objectMapper;

    public WebToolRegistrar(ToolRegistry toolRegistry,
                            ToolExecutionEngine toolExecutionEngine,
                            WebResearchService webResearchService,
                            ObjectMapper objectMapper) {
        this.toolRegistry = toolRegistry;
        this.toolExecutionEngine = toolExecutionEngine;
        this.webResearchService = webResearchService;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void registerTools() {
        registerWebSearchTool();
        registerWebPageReadTool();
    }

    private void registerWebSearchTool() {
        ToolDefinition tool = new ToolDefinition();
        tool.setId("web.search");
        tool.setName("Web Search");
        tool.setDescription("Performs a web search using a search engine and returns a list of results.");
        tool.setRiskLevel(RiskLevel.LOW);
        tool.setInputSchema("{\n" +
            "  \"type\": \"object\",\n" +
            "  \"properties\": {\n" +
            "    \"query\": { \"type\": \"string\", \"description\": \"The search query\" }\n" +
            "  },\n" +
            "  \"required\": [\"query\"]\n" +
            "}");

        toolRegistry.registerTool(tool);
        toolExecutionEngine.registerDynamicExecutor(tool.getId(), new ToolExecutor() {
            @Override
            public ToolDefinition getDefinition() { return tool; }

            @Override
            public ToolResult execute(ToolInvocation invocation) {
                String query = (String) invocation.getParameters().get("query");
                if (query == null || query.trim().isEmpty()) {
                    return ToolResult.failure("Query cannot be empty", 0);
                }
                try {
                    String payload = objectMapper.writeValueAsString(webResearchService.search(query));
                    return ToolResult.success(payload, 0);
                } catch (Exception e) {
                    return ToolResult.failure("Error executing search: " + e.getMessage(), 0);
                }
            }
        });
    }

    private void registerWebPageReadTool() {
        ToolDefinition tool = new ToolDefinition();
        tool.setId("web.page.read");
        tool.setName("Read Web Page");
        tool.setDescription("Fetches an HTML page and extracts plain semantic text for research.");
        tool.setRiskLevel(RiskLevel.LOW);
        tool.setInputSchema("{\n" +
            "  \"type\": \"object\",\n" +
            "  \"properties\": {\n" +
            "    \"url\": { \"type\": \"string\", \"description\": \"The URL of the webpage\" }\n" +
            "  },\n" +
            "  \"required\": [\"url\"]\n" +
            "}");

        toolRegistry.registerTool(tool);
        toolExecutionEngine.registerDynamicExecutor(tool.getId(), new ToolExecutor() {
            @Override
            public ToolDefinition getDefinition() { return tool; }

            @Override
            public ToolResult execute(ToolInvocation invocation) {
                String url = (String) invocation.getParameters().get("url");
                if (url == null || url.trim().isEmpty()) {
                    return ToolResult.failure("URL cannot be empty", 0);
                }
                try {
                    String payload = objectMapper.writeValueAsString(webResearchService.extractPageContent(url));
                    return ToolResult.success(payload, 0);
                } catch (Exception e) {
                    return ToolResult.failure("Error extracting page: " + e.getMessage(), 0);
                }
            }
        });
    }
}

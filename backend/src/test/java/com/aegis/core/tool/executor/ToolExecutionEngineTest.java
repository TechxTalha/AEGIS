package com.aegis.core.tool.executor;

import com.aegis.core.tool.model.ToolDefinition;
import com.aegis.core.tool.model.ToolInvocation;
import com.aegis.core.tool.model.ToolResult;
import com.aegis.core.tool.registry.InMemoryToolRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ToolExecutionEngineTest {

    private ToolExecutionEngine engine;
    private InMemoryToolRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new InMemoryToolRegistry();
        
        // Create a mock executor
        ToolExecutor mockExecutor = new ToolExecutor() {
            @Override
            public ToolDefinition getDefinition() {
                ToolDefinition def = new ToolDefinition();
                def.setId("mock.tool");
                def.setName("Mock Tool");
                def.setRiskLevel(com.aegis.core.tool.model.RiskLevel.LOW);
                def.setStatus(com.aegis.core.tool.model.ToolStatus.ACTIVE);
                return def;
            }

            @Override
            public ToolResult execute(ToolInvocation request) {
                if (request.getParameters().containsKey("fail")) {
                    return ToolResult.failure("Intentional failure", 10);
                }
                return ToolResult.success("Success payload: " + request.getParameters().get("data"), 20);
            }
        };

        engine = new ToolExecutionEngine(registry, Collections.singletonList(mockExecutor));
    }

    @Test
    void testExecuteSuccess() {
        ToolInvocation invocation = new ToolInvocation();
        invocation.setToolId("mock.tool");
        invocation.setParameters(Map.of("data", "hello world"));

        ToolResult result = engine.execute(invocation);

        assertTrue(result.isSuccess());
        assertEquals("Success payload: hello world", result.getPayload());
    }

    @Test
    void testExecuteFailure() {
        ToolInvocation invocation = new ToolInvocation();
        invocation.setToolId("mock.tool");
        invocation.setParameters(Map.of("fail", true));

        ToolResult result = engine.execute(invocation);

        assertFalse(result.isSuccess());
        assertEquals("Intentional failure", result.getErrorMessage());
    }

    @Test
    void testExecuteUnknownTool() {
        ToolInvocation invocation = new ToolInvocation();
        invocation.setToolId("unknown.tool");

        ToolResult result = engine.execute(invocation);

        assertFalse(result.isSuccess());
        assertTrue(result.getErrorMessage().contains("Tool not found in registry"));
    }

    @Test
    void testExecuteTimeout() {
        ToolExecutor sleepExecutor = new ToolExecutor() {
            @Override
            public ToolDefinition getDefinition() {
                ToolDefinition def = new ToolDefinition();
                def.setId("sleep.tool");
                def.setName("Sleep Tool");
                def.setRiskLevel(com.aegis.core.tool.model.RiskLevel.LOW);
                def.setStatus(com.aegis.core.tool.model.ToolStatus.ACTIVE);
                def.setExecutionConstraints(new com.aegis.core.tool.model.ExecutionConstraints(100L, 0, false));
                return def;
            }
            @Override
            public ToolResult execute(ToolInvocation request) {
                try {
                    Thread.sleep(500);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                return ToolResult.success("Woke up", 500);
            }
        };
        engine.registerDynamicExecutor("sleep.tool", sleepExecutor);
        registry.registerTool(sleepExecutor.getDefinition());

        ToolInvocation invocation = new ToolInvocation();
        invocation.setToolId("sleep.tool");

        long start = System.currentTimeMillis();
        ToolResult result = engine.execute(invocation);
        long elapsed = System.currentTimeMillis() - start;

        assertFalse(result.isSuccess());
        assertTrue(result.getErrorMessage().contains("timed out"));
        assertTrue(elapsed >= 100 && elapsed < 2000, "Execution should timeout around 100 ms");
    }
}

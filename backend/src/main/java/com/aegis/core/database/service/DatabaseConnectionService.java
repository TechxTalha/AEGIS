package com.aegis.core.database.service;

import com.aegis.core.database.model.DatabaseConnection;
import com.aegis.core.database.repository.DatabaseConnectionRepository;
import com.aegis.core.machine.service.SecretService;
import com.aegis.core.tool.executor.ToolExecutionEngine;
import com.aegis.core.tool.executor.ToolExecutor;
import com.aegis.core.tool.model.RiskLevel;
import com.aegis.core.tool.model.ToolDefinition;
import com.aegis.core.tool.model.ToolInvocation;
import com.aegis.core.tool.model.ToolResult;
import com.aegis.core.tool.registry.ToolRegistry;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DatabaseConnectionService {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseConnectionService.class);
    
    private final DatabaseConnectionRepository repository;
    private final SecretService secretService;
    private final DatabaseOperationManager operationManager;
    private final ToolRegistry toolRegistry;
    private final ToolExecutionEngine toolExecutionEngine;

    public DatabaseConnectionService(DatabaseConnectionRepository repository, 
                                     SecretService secretService, 
                                     DatabaseOperationManager operationManager,
                                     ToolRegistry toolRegistry,
                                     ToolExecutionEngine toolExecutionEngine) {
        this.repository = repository;
        this.secretService = secretService;
        this.operationManager = operationManager;
        this.toolRegistry = toolRegistry;
        this.toolExecutionEngine = toolExecutionEngine;
    }

    @PostConstruct
    public void init() {
        List<DatabaseConnection> connections = repository.findAll();
        for (DatabaseConnection db : connections) {
            registerDatabaseTools(db);
        }
    }

    public List<DatabaseConnection> getAllConnections() {
        return repository.findAll();
    }

    public DatabaseConnection getConnectionById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public boolean testConnection(DatabaseConnection db) {
        if (db == null) return false;
        String password = db.getEncryptedPassword();
        
        if (db.getId() != null && (password == null || password.isEmpty())) {
            DatabaseConnection existing = repository.findById(db.getId()).orElse(null);
            if (existing != null) {
                password = secretService.decrypt(existing.getEncryptedPassword());
            }
        }
        return operationManager.testConnection(db, password);
    }

    public DatabaseConnection addConnection(DatabaseConnection db) {
        if (db == null) throw new IllegalArgumentException("Database connection cannot be null");
        
        if (db.getId() != null) {
            repository.findById(db.getId()).ifPresent(existing -> {
                if (!existing.getName().equals(db.getName())) {
                    unregisterDatabaseTools(existing);
                }
                if (db.getEncryptedPassword() == null || db.getEncryptedPassword().isEmpty()) {
                    db.setEncryptedPassword(existing.getEncryptedPassword());
                } else {
                    db.setEncryptedPassword(secretService.encrypt(db.getEncryptedPassword()));
                }
            });
        } else {
            if (db.getEncryptedPassword() != null && !db.getEncryptedPassword().isEmpty()) {
                db.setEncryptedPassword(secretService.encrypt(db.getEncryptedPassword()));
            }
        }
        
        DatabaseConnection saved = repository.save(db);
        registerDatabaseTools(saved);
        return saved;
    }

    public void deleteConnection(Long id) {
        repository.findById(id).ifPresent(db -> {
            repository.deleteById(id);
            unregisterDatabaseTools(db);
        });
    }

    private void registerDatabaseTools(DatabaseConnection db) {
        String dbName = db.getName();

        // Tool 1: Schema Inspect
        String schemaToolId = "db.schema.inspect." + dbName;
        ToolDefinition schemaTool = new ToolDefinition();
        schemaTool.setId(schemaToolId);
        schemaTool.setName("Inspect Schema on " + dbName);
        schemaTool.setDescription("Retrieves a list of all tables and views in the database.");
        schemaTool.setRiskLevel(RiskLevel.MEDIUM);
        schemaTool.setInputSchema("{ \"type\": \"object\", \"properties\": {} }");
        
        toolRegistry.registerTool(schemaTool);
        toolExecutionEngine.registerDynamicExecutor(schemaToolId, new ToolExecutor() {
            @Override
            public ToolDefinition getDefinition() { return schemaTool; }
            @Override
            public ToolResult execute(ToolInvocation invocation) {
                String pwd = secretService.decrypt(db.getEncryptedPassword());
                return operationManager.getSchemaInfo(db, pwd);
            }
        });

        // Tool 2: Table Inspect
        String tableToolId = "db.table.inspect." + dbName;
        ToolDefinition tableTool = new ToolDefinition();
        tableTool.setId(tableToolId);
        tableTool.setName("Inspect Table on " + dbName);
        tableTool.setDescription("Retrieves the columns, data types, and sizes for a specific table.");
        tableTool.setRiskLevel(RiskLevel.MEDIUM);
        tableTool.setInputSchema("{\n" +
            "  \"type\": \"object\",\n" +
            "  \"properties\": {\n" +
            "    \"tableName\": { \"type\": \"string\", \"description\": \"Name of the table\" }\n" +
            "  },\n" +
            "  \"required\": [\"tableName\"]\n" +
            "}");
        
        toolRegistry.registerTool(tableTool);
        toolExecutionEngine.registerDynamicExecutor(tableToolId, new ToolExecutor() {
            @Override
            public ToolDefinition getDefinition() { return tableTool; }
            @Override
            public ToolResult execute(ToolInvocation invocation) {
                String tableName = (String) invocation.getParameters().get("tableName");
                if (tableName == null || tableName.trim().isEmpty()) {
                    return ToolResult.failure("Missing tableName parameter", 0);
                }
                String pwd = secretService.decrypt(db.getEncryptedPassword());
                return operationManager.getTableInfo(db, pwd, tableName);
            }
        });

        // Tool 3: Execute Query
        String queryToolId = "db.query.execute." + dbName;
        ToolDefinition queryTool = new ToolDefinition();
        queryTool.setId(queryToolId);
        queryTool.setName("Execute Query on " + dbName);
        queryTool.setDescription("Executes a read-only SQL query on the database. Max 1000 rows returned.");
        queryTool.setRiskLevel(RiskLevel.HIGH);
        queryTool.setInputSchema("{\n" +
            "  \"type\": \"object\",\n" +
            "  \"properties\": {\n" +
            "    \"query\": { \"type\": \"string\", \"description\": \"The SQL query to execute\" }\n" +
            "  },\n" +
            "  \"required\": [\"query\"]\n" +
            "}");
        
        toolRegistry.registerTool(queryTool);
        toolExecutionEngine.registerDynamicExecutor(queryToolId, new ToolExecutor() {
            @Override
            public ToolDefinition getDefinition() { return queryTool; }
            @Override
            public ToolResult execute(ToolInvocation invocation) {
                String query = (String) invocation.getParameters().get("query");
                if (query == null || query.trim().isEmpty()) {
                    return ToolResult.failure("Missing query parameter", 0);
                }
                String pwd = secretService.decrypt(db.getEncryptedPassword());
                return operationManager.executeReadOnlyQuery(db, pwd, query);
            }
        });

        logger.info("Registered DB tools for {}", dbName);
    }

    private void unregisterDatabaseTools(DatabaseConnection db) {
        String dbName = db.getName();
        List<String> toolIds = List.of(
            "db.schema.inspect." + dbName,
            "db.table.inspect." + dbName,
            "db.query.execute." + dbName
        );
        
        for (String id : toolIds) {
            toolRegistry.getTool(id).ifPresent(tool -> {
                tool.setStatus(com.aegis.core.tool.model.ToolStatus.INACTIVE);
            });
        }
        logger.info("Deactivated DB tools for {}", dbName);
    }
}

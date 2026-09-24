package com.aegis.core.database.service;

import com.aegis.core.database.model.DatabaseConnection;
import com.aegis.core.tool.model.ToolResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class DatabaseOperationManager {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseOperationManager.class);
    private final SqlQueryAnalyzer sqlQueryAnalyzer;
    private final ObjectMapper objectMapper;

    public DatabaseOperationManager(SqlQueryAnalyzer sqlQueryAnalyzer) {
        this.sqlQueryAnalyzer = sqlQueryAnalyzer;
        this.objectMapper = new ObjectMapper();
    }

    private String buildJdbcUrl(DatabaseConnection db) {
        String type = db.getDbType().toLowerCase();
        if ("mysql".equals(type)) {
            return String.format("jdbc:mysql://%s:%d/%s?useSSL=false&serverTimezone=UTC", db.getHost(), db.getPort(), db.getDatabaseName());
        } else if ("postgres".equals(type) || "postgresql".equals(type)) {
            return String.format("jdbc:postgresql://%s:%d/%s", db.getHost(), db.getPort(), db.getDatabaseName());
        }
        throw new IllegalArgumentException("Unsupported database type: " + type);
    }

    public boolean testConnection(DatabaseConnection db, String plainTextPassword) {
        String url = buildJdbcUrl(db);
        try (Connection conn = DriverManager.getConnection(url, db.getUsername(), plainTextPassword)) {
            return conn.isValid(5);
        } catch (SQLException e) {
            logger.error("DB Connection test failed for {}: {}", db.getName(), e.getMessage());
            return false;
        }
    }

    public ToolResult getSchemaInfo(DatabaseConnection db, String plainTextPassword) {
        String url = buildJdbcUrl(db);
        try (Connection conn = DriverManager.getConnection(url, db.getUsername(), plainTextPassword)) {
            DatabaseMetaData metaData = conn.getMetaData();
            
            List<String> tables = new ArrayList<>();
            try (ResultSet rs = metaData.getTables(conn.getCatalog(), null, "%", new String[]{"TABLE", "VIEW"})) {
                while (rs.next()) {
                    tables.add(rs.getString("TABLE_NAME"));
                }
            }
            return ToolResult.success(objectMapper.writeValueAsString(Map.of("tables", tables)), 0);
        } catch (Exception e) {
            logger.error("DB Schema Inspect failed for {}: {}", db.getName(), e.getMessage());
            return ToolResult.failure("Failed to retrieve schema: " + e.getMessage(), 0);
        }
    }

    public ToolResult getTableInfo(DatabaseConnection db, String plainTextPassword, String tableName) {
        String url = buildJdbcUrl(db);
        try (Connection conn = DriverManager.getConnection(url, db.getUsername(), plainTextPassword)) {
            DatabaseMetaData metaData = conn.getMetaData();
            
            List<Map<String, String>> columns = new ArrayList<>();
            try (ResultSet rs = metaData.getColumns(conn.getCatalog(), null, tableName, "%")) {
                while (rs.next()) {
                    Map<String, String> col = new HashMap<>();
                    col.put("columnName", rs.getString("COLUMN_NAME"));
                    col.put("dataType", rs.getString("TYPE_NAME"));
                    col.put("columnSize", rs.getString("COLUMN_SIZE"));
                    columns.add(col);
                }
            }
            return ToolResult.success(objectMapper.writeValueAsString(Map.of("tableName", tableName, "columns", columns)), 0);
        } catch (Exception e) {
            logger.error("DB Table Inspect failed for {}: {}", db.getName(), e.getMessage());
            return ToolResult.failure("Failed to retrieve table info: " + e.getMessage(), 0);
        }
    }

    public ToolResult executeReadOnlyQuery(DatabaseConnection db, String plainTextPassword, String query) {
        if (!sqlQueryAnalyzer.isSafeReadOnlyQuery(query)) {
            return ToolResult.failure("SECURITY VIOLATION: Query is either destructive or not permitted. Only standard SELECT/SHOW queries are allowed.", 0);
        }

        String url = buildJdbcUrl(db);
        try (Connection conn = DriverManager.getConnection(url, db.getUsername(), plainTextPassword);
             Statement stmt = conn.createStatement()) {
            
            // Set query timeout to prevent hanging
            stmt.setQueryTimeout(30);

            try (ResultSet rs = stmt.executeQuery(query)) {
                ResultSetMetaData metaData = rs.getMetaData();
                int columnCount = metaData.getColumnCount();
                
                List<Map<String, Object>> rows = new ArrayList<>();
                int rowCount = 0;
                while (rs.next()) {
                    if (rowCount >= 1000) {
                        break; // Hard limit for safety
                    }
                    Map<String, Object> row = new HashMap<>();
                    for (int i = 1; i <= columnCount; i++) {
                        row.put(metaData.getColumnName(i), rs.getObject(i));
                    }
                    rows.add(row);
                    rowCount++;
                }
                
                Map<String, Object> result = new HashMap<>();
                result.put("rows", rows);
                result.put("truncated", rowCount >= 1000);
                
                return ToolResult.success(objectMapper.writeValueAsString(result), 0);
            }
        } catch (Exception e) {
            logger.error("DB Query execution failed for {}: {}", db.getName(), e.getMessage());
            return ToolResult.failure("Query execution failed: " + e.getMessage(), 0);
        }
    }
}

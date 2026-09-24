package com.aegis.core.database.controller;

import com.aegis.core.database.model.DatabaseConnection;
import com.aegis.core.database.service.DatabaseConnectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/databases")
@PreAuthorize("hasRole('ADMIN')")
public class DatabaseConnectionController {

    private final DatabaseConnectionService databaseConnectionService;

    public DatabaseConnectionController(DatabaseConnectionService databaseConnectionService) {
        this.databaseConnectionService = databaseConnectionService;
    }

    private DatabaseConnection maskPassword(DatabaseConnection db) {
        if (db == null) return null;
        DatabaseConnection safe = new DatabaseConnection();
        safe.setId(db.getId());
        safe.setName(db.getName());
        safe.setDbType(db.getDbType());
        safe.setHost(db.getHost());
        safe.setPort(db.getPort());
        safe.setDatabaseName(db.getDatabaseName());
        safe.setUsername(db.getUsername());
        safe.setCreatedAt(db.getCreatedAt());
        safe.setUpdatedAt(db.getUpdatedAt());
        safe.setEncryptedPassword(null); // Masked
        return safe;
    }

    @GetMapping
    public ResponseEntity<List<DatabaseConnection>> getAllConnections() {
        List<DatabaseConnection> connections = databaseConnectionService.getAllConnections().stream()
                .map(this::maskPassword)
                .collect(Collectors.toList());
        return ResponseEntity.ok(connections);
    }

    @PostMapping
    public ResponseEntity<DatabaseConnection> addConnection(@RequestBody DatabaseConnection db) {
        DatabaseConnection saved = databaseConnectionService.addConnection(db);
        return ResponseEntity.ok(maskPassword(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConnection(@PathVariable Long id) {
        databaseConnectionService.deleteConnection(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/test")
    public ResponseEntity<Boolean> testConnection(@RequestBody DatabaseConnection db) {
        boolean success = databaseConnectionService.testConnection(db);
        return ResponseEntity.ok(success);
    }
}

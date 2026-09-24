package com.aegis.core.machine.controller;

import com.aegis.core.machine.model.RemoteMachine;
import com.aegis.core.machine.service.RemoteMachineService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/machines")
@PreAuthorize("hasRole('ADMIN')")
public class RemoteMachineController {

    private final RemoteMachineService remoteMachineService;

    public RemoteMachineController(RemoteMachineService remoteMachineService) {
        this.remoteMachineService = remoteMachineService;
    }

    @GetMapping
    public ResponseEntity<List<RemoteMachine>> getAllMachines() {
        List<RemoteMachine> machines = remoteMachineService.getAllMachines();
        // Create safe copies to avoid Hibernate dirty-checking (Open-In-View bug)
        List<RemoteMachine> safeMachines = machines.stream().map(m -> {
            RemoteMachine safe = new RemoteMachine();
            safe.setId(m.getId());
            safe.setName(m.getName());
            safe.setHostname(m.getHostname());
            safe.setPort(m.getPort());
            safe.setUsername(m.getUsername());
            safe.setAuthType(m.getAuthType());
            safe.setEncryptedCredential(null);
            safe.setEncryptedPassphrase(null);
            return safe;
        }).toList();
        return ResponseEntity.ok(safeMachines);
    }

    @PostMapping("/test")
    public ResponseEntity<Boolean> testConnection(@RequestBody RemoteMachine machine) {
        boolean success = remoteMachineService.testConnection(machine);
        return ResponseEntity.ok(success);
    }

    @PostMapping
    public ResponseEntity<RemoteMachine> addMachine(@RequestBody RemoteMachine machine) {
        RemoteMachine saved = remoteMachineService.addMachine(machine);
        
        RemoteMachine safe = new RemoteMachine();
        safe.setId(saved.getId());
        safe.setName(saved.getName());
        safe.setHostname(saved.getHostname());
        safe.setPort(saved.getPort());
        safe.setUsername(saved.getUsername());
        safe.setAuthType(saved.getAuthType());
        safe.setEncryptedCredential(null);
        safe.setEncryptedPassphrase(null);
        
        return ResponseEntity.ok(safe);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMachine(@PathVariable Long id) {
        remoteMachineService.deleteMachine(id);
        return ResponseEntity.ok().build();
    }
}

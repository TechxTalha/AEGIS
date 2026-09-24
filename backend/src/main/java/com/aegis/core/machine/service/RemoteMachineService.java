package com.aegis.core.machine.service;

import com.aegis.core.machine.model.RemoteMachine;
import com.aegis.core.machine.repository.RemoteMachineRepository;
import com.aegis.core.tool.executor.ToolExecutionEngine;
import com.aegis.core.tool.executor.ToolExecutor;
import com.aegis.core.tool.model.ExecutionConstraints;
import com.aegis.core.tool.model.RiskLevel;
import com.aegis.core.tool.model.ToolDefinition;
import com.aegis.core.tool.model.ToolInvocation;
import com.aegis.core.tool.model.ToolResult;
import com.aegis.core.tool.model.ToolStatus;
import com.aegis.core.tool.registry.ToolRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class RemoteMachineService {

    private static final Logger logger = LoggerFactory.getLogger(RemoteMachineService.class);

    private final RemoteMachineRepository repository;
    private final ToolRegistry toolRegistry;
    private final ToolExecutionEngine toolExecutionEngine;
    private final SshConnectionManager sshConnectionManager;
    private final SecretService secretService;

    public RemoteMachineService(RemoteMachineRepository repository,
                                ToolRegistry toolRegistry,
                                ToolExecutionEngine toolExecutionEngine,
                                SshConnectionManager sshConnectionManager,
                                SecretService secretService) {
        this.repository = repository;
        this.toolRegistry = toolRegistry;
        this.toolExecutionEngine = toolExecutionEngine;
        this.sshConnectionManager = sshConnectionManager;
        this.secretService = secretService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initializeMachines() {
        List<RemoteMachine> machines = repository.findAll();
        for (RemoteMachine machine : machines) {
            registerMachineTools(machine);
        }
    }

    public boolean testConnection(RemoteMachine machine) {
        if (machine == null) return false;
        
        String credential = machine.getEncryptedCredential();
        String passphrase = machine.getEncryptedPassphrase();
        
        if (machine.getId() != null && (credential == null || credential.isEmpty())) {
            // Testing an existing machine with masked credentials
            RemoteMachine existing = repository.findById(machine.getId()).orElse(null);
            if (existing != null) {
                credential = secretService.decrypt(existing.getEncryptedCredential());
                passphrase = secretService.decrypt(existing.getEncryptedPassphrase());
            }
        }

        return sshConnectionManager.testConnection(machine, credential, passphrase);
    }

    public RemoteMachine addMachine(RemoteMachine machine) {
        if (machine == null) {
            throw new IllegalArgumentException("Machine cannot be null");
        }
        if (machine.getId() != null) {
            repository.findById(machine.getId()).ifPresent(existing -> {
                if (!existing.getName().equals(machine.getName())) {
                    unregisterMachineTools(existing);
                }
                if (machine.getEncryptedCredential() == null || machine.getEncryptedCredential().isEmpty()) {
                    machine.setEncryptedCredential(existing.getEncryptedCredential());
                } else {
                    machine.setEncryptedCredential(secretService.encrypt(machine.getEncryptedCredential()));
                }
                if (machine.getEncryptedPassphrase() == null || machine.getEncryptedPassphrase().isEmpty()) {
                    machine.setEncryptedPassphrase(existing.getEncryptedPassphrase());
                } else {
                    machine.setEncryptedPassphrase(secretService.encrypt(machine.getEncryptedPassphrase()));
                }
            });
        } else {
            if (machine.getEncryptedCredential() != null && !machine.getEncryptedCredential().isEmpty()) {
                machine.setEncryptedCredential(secretService.encrypt(machine.getEncryptedCredential()));
            }
            if (machine.getEncryptedPassphrase() != null && !machine.getEncryptedPassphrase().isEmpty()) {
                machine.setEncryptedPassphrase(secretService.encrypt(machine.getEncryptedPassphrase()));
            }
        }
        
        RemoteMachine saved = repository.save(machine);
        registerMachineTools(saved);
        return saved;
    }

    public void deleteMachine(Long id) {
        repository.findById(id).ifPresent(machine -> {
            repository.deleteById(id);
            unregisterMachineTools(machine);
        });
    }

    public List<RemoteMachine> getAllMachines() {
        return repository.findAll();
    }

    private void registerMachineTools(RemoteMachine machine) {
        String agentId = machine.getName();
        String baseToolId = "sys.execute." + agentId;

        ToolDefinition tool = new ToolDefinition();
        tool.setId(baseToolId);
        tool.setName("Remote Execute on " + machine.getHostname());
        tool.setDescription("Execute a terminal command via SSH on " + machine.getHostname());
        tool.setInputSchema("{ \"type\": \"object\", \"properties\": { \"command\": { \"type\": \"string\" } }, \"required\": [\"command\"] }");
        tool.setOutputSchema("{ \"type\": \"object\", \"properties\": { \"stdout\": { \"type\": \"string\" }, \"stderr\": { \"type\": \"string\" }, \"exitCode\": { \"type\": \"integer\" } } }");
        tool.setRiskLevel(RiskLevel.HIGH);
        tool.setStatus(ToolStatus.ACTIVE);
        tool.setExecutionConstraints(new ExecutionConstraints(60000L, 0, false));

        toolRegistry.registerTool(tool);

        toolExecutionEngine.registerDynamicExecutor(tool.getId(), new ToolExecutor() {
            @Override
            public ToolDefinition getDefinition() {
                return tool;
            }

            @Override
            public ToolResult execute(ToolInvocation invocation) {
                try {
                    Map<String, Object> params = invocation.getParameters();
                    if (params == null || !params.containsKey("command") || params.get("command") == null) {
                        return ToolResult.failure("Missing or null 'command' parameter", 0);
                    }
                    String command = (String) params.get("command");
                    if (command.trim().isEmpty()) {
                        return ToolResult.failure("Command cannot be empty", 0);
                    }
                    
                    // Decrypt credentials at execution time
                    String credential = secretService.decrypt(machine.getEncryptedCredential());
                    String passphrase = secretService.decrypt(machine.getEncryptedPassphrase());
                    
                    return sshConnectionManager.executeCommand(machine, credential, passphrase, command);
                } catch (Exception e) {
                    return ToolResult.failure("SSH Execution Error: " + e.getMessage(), 0);
                }
            }
        });

        logger.info("Registered remote machine tools for {}", machine.getName());
    }

    private void unregisterMachineTools(RemoteMachine machine) {
        String agentId = machine.getName();
        String baseToolId = "sys.execute." + agentId;
        toolRegistry.getTool(baseToolId).ifPresent(tool -> {
            tool.setStatus(ToolStatus.INACTIVE);
            logger.info("Deactivated remote machine tools for {}", machine.getName());
        });
    }
}

package com.aegis.agent.local;

import com.aegis.core.agent.auth.AgentIdentityService;
import com.aegis.core.agent.dto.AgentHeartbeat;
import com.aegis.core.agent.dto.AgentRegisterRequest;
import com.aegis.core.agent.dto.AgentResult;
import com.aegis.core.tool.model.ToolInvocation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class LocalMachineAgent {
    private static final Logger logger = LoggerFactory.getLogger(LocalMachineAgent.class);
    
    private final AgentIdentityService identityService;
    private final CommandExecutor commandExecutor;
    private final FileSystemExecutor fileSystemExecutor;
    private final SystemInfoProvider systemInfoProvider;
    private final SystemLogReader systemLogReader;
    
    private final java.util.concurrent.ExecutorService agentExecutor = java.util.concurrent.Executors.newCachedThreadPool();

    private StompSession session;

    public LocalMachineAgent(AgentIdentityService identityService, 
                             CommandExecutor commandExecutor,
                             FileSystemExecutor fileSystemExecutor,
                             SystemInfoProvider systemInfoProvider,
                             SystemLogReader systemLogReader) {
        this.identityService = identityService;
        this.commandExecutor = commandExecutor;
        this.fileSystemExecutor = fileSystemExecutor;
        this.systemInfoProvider = systemInfoProvider;
        this.systemLogReader = systemLogReader;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void connect() {
        try {
            WebSocketStompClient stompClient = new WebSocketStompClient(new StandardWebSocketClient());
            stompClient.setMessageConverter(new MappingJackson2MessageConverter());

            WebSocketHttpHeaders headers = new WebSocketHttpHeaders();
            
            StompHeaders stompHeaders = new StompHeaders();
            stompHeaders.add("Authorization", "Bearer " + identityService.getAgentToken());

            String url = "ws://localhost:8080/ws";
            logger.info("LocalMachineAgent connecting to AEGIS at {}", url);

            stompClient.connectAsync(url, headers, stompHeaders, new AgentSessionHandler())
                .thenAccept(s -> {
                    this.session = s;
                    logger.info("LocalMachineAgent connected successfully.");
                    registerAgent();
                    startHeartbeat();
                })
                .exceptionally(ex -> {
                    logger.error("LocalMachineAgent failed to connect: {}", ex.getMessage());
                    return null;
                });

        } catch (Exception e) {
            logger.error("Error initializing LocalMachineAgent", e);
        }
    }

    private void registerAgent() {
        AgentRegisterRequest request = new AgentRegisterRequest();
        request.setHostname(System.getProperty("user.name") + "-local");
        request.setOs(System.getProperty("os.name"));
        request.setCapabilities(Arrays.asList("sys.execute", "sys.fs", "sys.info", "sys.logs"));

        session.send("/app/agent/register", request);
    }

    private void startHeartbeat() {
        ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();
        executor.scheduleAtFixedRate(() -> {
            if (session != null && session.isConnected()) {
                session.send("/app/agent/heartbeat", new AgentHeartbeat("ALIVE"));
            }
        }, 5, 15, TimeUnit.SECONDS);
    }

    private class AgentSessionHandler extends StompSessionHandlerAdapter {
        @Override
        public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
            // Listen for command execution requests
            session.subscribe("/user/queue/agent/execute", new StompSessionHandlerAdapter() {
                @Override
                public Type getPayloadType(StompHeaders headers) {
                    return ToolInvocation.class;
                }

                @Override
                public void handleFrame(StompHeaders headers, Object payload) {
                    ToolInvocation invocation = (ToolInvocation) payload;
                    logger.info("Agent received execute command for task: {}", invocation.getTaskId());
                    
                    agentExecutor.submit(() -> {
                        AgentResult result = new AgentResult();
                        result.setTaskId(invocation.getTaskId());
                        result.setSuccess(true);
                        result.setExitCode(0);

                        try {
                            String toolId = invocation.getToolId();
                            if (invocation.getParameters() == null) {
                                invocation.setParameters(new java.util.HashMap<>());
                            }
                            if (toolId.startsWith("sys.execute")) {
                                List<String> args = (List<String>) invocation.getParameters().get("args");
                                String command = (String) invocation.getParameters().get("command");
                                List<String> mutableArgs = new java.util.ArrayList<>();
                                mutableArgs.add(command);
                                if (args != null) mutableArgs.addAll(args);
                                result = commandExecutor.executeCommand(invocation.getTaskId(), identityService.getAgentUsername(), mutableArgs, 30000L);
                            } else if (toolId.startsWith("sys.info.memory")) {
                                result.setStdout(systemInfoProvider.getMemoryInfo(identityService.getAgentUsername()));
                            } else if (toolId.startsWith("sys.info.cpu")) {
                                result.setStdout(systemInfoProvider.getCpuInfo(identityService.getAgentUsername()));
                            } else if (toolId.startsWith("sys.info.processes")) {
                                result.setStdout(systemInfoProvider.getProcessesInfo(identityService.getAgentUsername()));
                            } else if (toolId.startsWith("sys.info.disk")) {
                                result.setStdout(systemInfoProvider.getDiskInfo(identityService.getAgentUsername()));
                            } else if (toolId.startsWith("sys.info.network")) {
                                result.setStdout(systemInfoProvider.getNetworkInfo(identityService.getAgentUsername()));
                            } else if (toolId.startsWith("sys.info.services")) {
                                result.setStdout(systemInfoProvider.getServicesInfo(identityService.getAgentUsername()));
                            } else if (toolId.startsWith("sys.logs.read")) {
                                String path = (String) invocation.getParameters().get("path");
                                Integer lines = (Integer) invocation.getParameters().get("lines");
                                if (lines == null) lines = 100;
                                result.setStdout(systemLogReader.readLogLines(identityService.getAgentUsername(), path, lines));
                            } else if (toolId.startsWith("sys.fs.read")) {
                                String path = (String) invocation.getParameters().get("path");
                                result.setStdout(fileSystemExecutor.readFile(identityService.getAgentUsername(), path));
                            } else if (toolId.startsWith("sys.fs.write")) {
                                String path = (String) invocation.getParameters().get("path");
                                String content = (String) invocation.getParameters().get("content");
                                fileSystemExecutor.writeFile(identityService.getAgentUsername(), path, content);
                                result.setStdout("File written successfully.");
                            } else if (toolId.startsWith("sys.fs.list")) {
                                String path = (String) invocation.getParameters().get("path");
                                result.setStdout(String.join("\n", fileSystemExecutor.listDirectory(identityService.getAgentUsername(), path)));
                            } else {
                                result.setSuccess(false);
                                result.setExitCode(1);
                                result.setErrorMessage("Unknown tool: " + toolId);
                            }
                        } catch (Exception e) {
                            result.setSuccess(false);
                            result.setExitCode(1);
                            result.setErrorMessage("Error: " + e.getClass().getSimpleName() + " - " + e.getMessage());
                        }
                        
                        session.send("/app/agent/result", result);
                    });
                }
            });
            
            // Listen for cancellation requests
            session.subscribe("/user/queue/agent/cancel", new StompSessionHandlerAdapter() {
                @Override
                public Type getPayloadType(StompHeaders headers) {
                    return String.class;
                }

                @Override
                public void handleFrame(StompHeaders headers, Object payload) {
                    String taskId = (String) payload;
                    logger.warn("Agent received cancellation request for task: {}", taskId);
                    commandExecutor.cancelCommand(taskId, identityService.getAgentUsername());
                }
            });
        }

        @Override
        public void handleException(StompSession session, StompCommand command, StompHeaders headers, byte[] payload, Throwable exception) {
            logger.error("STOMP error: {}", exception.getMessage(), exception);
        }

        @Override
        public void handleTransportError(StompSession session, Throwable exception) {
            logger.error("STOMP transport error: {}", exception.getMessage(), exception);
        }
    }

    @jakarta.annotation.PreDestroy
    public void cleanup() {
        agentExecutor.shutdownNow();
    }
}

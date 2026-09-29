package com.aegis.core.task.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AudioWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(AudioWebSocketHandler.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    
    // Track conversation state per session for authentication simulation
    private final Map<String, String> conversationState = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("Audio WebSocket Connection Established: {}", session.getId());
        sessions.put(session.getId(), session);
        conversationState.put(session.getId(), "AWAITING_COMMAND");
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            JsonNode json = objectMapper.readTree(message.getPayload());
            String type = json.has("type") ? json.get("type").asText() : "";
            
            if ("audio_chunk".equals(type)) {
                // Ignore actual audio for simulation purposes
            } else if ("end_stream".equals(type)) {
                log.info("Client ended audio stream. Processing...");
                Thread.sleep(1000); // Simulate processing delay
                
                String currentState = conversationState.getOrDefault(session.getId(), "AWAITING_COMMAND");
                
                if ("AWAITING_COMMAND".equals(currentState)) {
                    // Simulate hearing a high-risk command
                    log.info("Simulating high-risk command detection.");
                    conversationState.put(session.getId(), "AWAITING_PASSPHRASE");
                    sendResponse(session, "auth_challenge", "This is a restricted operation. Please state your voice authorization code.");
                } else if ("AWAITING_PASSPHRASE".equals(currentState)) {
                    // Simulate verifying the passphrase
                    log.info("Simulating passphrase verification.");
                    conversationState.put(session.getId(), "AWAITING_COMMAND");
                    sendResponse(session, "response", "Identity verified. The operation has been successfully executed.");
                }
            }
        } catch (Exception e) {
            log.error("Error handling audio message", e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        log.info("Audio WebSocket Connection Closed: {}", session.getId());
        sessions.remove(session.getId());
        conversationState.remove(session.getId());
    }
    
    private void sendResponse(WebSocketSession session, String type, String payload) {
        try {
            if (session.isOpen()) {
                String responseJson = objectMapper.writeValueAsString(Map.of(
                    "type", type,
                    "payload", payload
                ));
                session.sendMessage(new TextMessage(responseJson));
            }
        } catch (IOException e) {
            log.error("Failed to send simulation response", e);
        }
    }
}

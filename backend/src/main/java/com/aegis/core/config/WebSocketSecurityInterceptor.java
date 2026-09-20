package com.aegis.core.config;

import com.aegis.core.auth.security.JwtTokenProvider;
import com.aegis.core.auth.security.UserDetailsServiceImpl;
import com.aegis.core.task.entity.Task;
import com.aegis.core.task.repository.TaskRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class WebSocketSecurityInterceptor implements ChannelInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketSecurityInterceptor.class);

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsServiceImpl userDetailsService;
    private final TaskRepository taskRepository;

    public WebSocketSecurityInterceptor(JwtTokenProvider jwtTokenProvider, 
                                        UserDetailsServiceImpl userDetailsService,
                                        TaskRepository taskRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
        this.taskRepository = taskRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null) {
            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                String authHeader = accessor.getFirstNativeHeader("Authorization");
                if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    try {
                        if (jwtTokenProvider.validateToken(token)) {
                            String username = jwtTokenProvider.getUsernameFromJWT(token);
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                            UsernamePasswordAuthenticationToken authentication = 
                                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                            
                            accessor.setUser(authentication);
                        } else {
                            throw new IllegalArgumentException("Invalid JWT Token in WebSocket CONNECT");
                        }
                    } catch (Exception e) {
                        logger.error("Cannot set user authentication for WebSocket: {}", e.getMessage());
                        throw new IllegalArgumentException("Failed to authenticate WebSocket connection", e);
                    }
                } else {
                    throw new IllegalArgumentException("Missing or invalid Authorization header in WebSocket CONNECT");
                }
            } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                String destination = accessor.getDestination();
                if (destination != null && destination.startsWith("/topic/tasks/")) {
                    try {
                        Long taskId = Long.parseLong(destination.substring("/topic/tasks/".length()));
                        if (accessor.getUser() == null || accessor.getUser().getName() == null) {
                            throw new IllegalArgumentException("Unauthenticated subscription attempt");
                        }
                        String username = accessor.getUser().getName();
                        Task task = taskRepository.findById(taskId)
                                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
                        
                        if (!task.getUser().getUsername().equals(username)) {
                            throw new IllegalArgumentException("Access denied: You do not own this task");
                        }
                    } catch (NumberFormatException e) {
                        throw new IllegalArgumentException("Invalid task ID in subscription destination");
                    }
                }
            }
        }
        return message;
    }
}

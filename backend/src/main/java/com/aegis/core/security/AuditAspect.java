package com.aegis.core.security;

import com.aegis.core.tool.model.ToolInvocation;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class AuditAspect {

    private static final Logger logger = LoggerFactory.getLogger(AuditAspect.class);
    private final AuditLogRepository auditLogRepository;

    public AuditAspect(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Before("execution(* com.aegis.core.tool.executor.ToolExecutionEngine.executeTool(..)) && args(invocation)")
    public void logToolExecution(JoinPoint joinPoint, ToolInvocation invocation) {
        String principal = getCurrentUser();
        String action = "TOOL_EXECUTION";
        String details = "Executing tool: " + invocation.getToolId() + " with args: " + invocation.getParameters();

        saveLog(principal, action, details);
    }

    @AfterReturning(pointcut = "execution(* com.aegis.core.auth.AuthService.authenticateUser(..))", returning = "result")
    public void logAuthenticationSuccess(JoinPoint joinPoint, Object result) {
        Object[] args = joinPoint.getArgs();
        String username = "unknown";
        if (args != null && args.length > 0) {
            // Assume first arg is LoginRequest
            // Reflection or casting could be used, but let's extract from args[0].toString() for simplicity
            username = args[0].toString();
        }

        saveLog(username, "AUTH_SUCCESS", "User successfully authenticated.");
    }

    private String getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            return auth.getName();
        }
        return "SYSTEM";
    }

    private void saveLog(String principal, String action, String details) {
        try {
            AuditLog log = new AuditLog();
            log.setPrincipal(principal);
            log.setAction(action);
            log.setDetails(details);
            auditLogRepository.save(log);
            logger.info("AUDIT: {} | {} | {}", principal, action, details);
        } catch (Exception e) {
            logger.error("Failed to save audit log: {}", e.getMessage());
        }
    }
}

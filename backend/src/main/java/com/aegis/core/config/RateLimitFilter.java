package com.aegis.core.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter implements Filter {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    private Bucket resolveBucket(String clientIp) {
        return cache.computeIfAbsent(clientIp, this::newBucket);
    }

    private Bucket newBucket(String clientIp) {
        // 100 requests per minute per IP
        Refill refill = Refill.intervally(100, Duration.ofMinutes(1));
        Bandwidth limit = Bandwidth.classic(100, refill);
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        String clientIp = httpRequest.getRemoteAddr();
        
        // Stricter limit for login
        if (httpRequest.getRequestURI().contains("/api/auth/login")) {
            Bucket loginBucket = cache.computeIfAbsent("login_" + clientIp, ip -> {
                // 5 requests per minute for login
                Refill refill = Refill.intervally(5, Duration.ofMinutes(1));
                Bandwidth limit = Bandwidth.classic(5, refill);
                return Bucket.builder().addLimit(limit).build();
            });
            if (!loginBucket.tryConsume(1)) {
                httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                httpResponse.getWriter().write("Too many login attempts");
                return;
            }
        } else {
            Bucket bucket = resolveBucket(clientIp);
            if (!bucket.tryConsume(1)) {
                httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                httpResponse.getWriter().write("Too many requests");
                return;
            }
        }

        chain.doFilter(request, response);
    }
}

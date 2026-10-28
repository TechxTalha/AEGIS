package com.aegis.core.auth;

import com.aegis.core.auth.dto.LoginRequest;
import com.aegis.core.auth.dto.RegisterRequest;
import com.aegis.core.auth.dto.TokenResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Value("${jwt.cookie-name:aegis_refresh_token}")
    private String jwtCookieName;
    
    @Value("${jwt.refresh-expiration}")
    private long refreshExpirationMs;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    private boolean isSecureRequest(HttpServletRequest request) {
        return request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, 
                                            HttpServletRequest request, 
                                            HttpServletResponse response) {
        TokenResponse tokenResponse = authService.authenticateUser(loginRequest);
        String refreshToken = authService.generateRefreshToken(loginRequest.getUsername());
        tokenResponse.setRefreshToken(refreshToken);
        
        boolean isHttps = isSecureRequest(request);
        ResponseCookie cookie = ResponseCookie.from(jwtCookieName, refreshToken)
                .httpOnly(true)
                .secure(isHttps)
                .path("/api/auth/refresh")
                .maxAge(refreshExpirationMs / 1000)
                .sameSite(isHttps ? "Strict" : "Lax")
                .build();
                
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(tokenResponse);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest signUpRequest) {
        try {
            authService.registerUser(signUpRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully");
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(
            @CookieValue(name = "${jwt.cookie-name:aegis_refresh_token}", required = false) String cookieRefreshToken,
            @RequestBody(required = false) Map<String, String> requestBody,
            @RequestHeader(name = "X-Refresh-Token", required = false) String headerRefreshToken,
            HttpServletRequest request,
            HttpServletResponse response) {

        String token = cookieRefreshToken;
        if ((token == null || token.isBlank()) && requestBody != null) {
            token = requestBody.get("refreshToken");
        }
        if ((token == null || token.isBlank()) && headerRefreshToken != null) {
            token = headerRefreshToken;
        }

        if (token == null || token.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh Token is empty!");
        }

        try {
            TokenResponse tokenResponse = authService.refreshToken(token);
            tokenResponse.setRefreshToken(token);

            boolean isHttps = isSecureRequest(request);
            ResponseCookie cookie = ResponseCookie.from(jwtCookieName, token)
                    .httpOnly(true)
                    .secure(isHttps)
                    .path("/api/auth/refresh")
                    .maxAge(refreshExpirationMs / 1000)
                    .sameSite(isHttps ? "Strict" : "Lax")
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

            return ResponseEntity.ok(tokenResponse);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid refresh token");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(HttpServletRequest request, HttpServletResponse response) {
        boolean isHttps = isSecureRequest(request);
        ResponseCookie cookie = ResponseCookie.from(jwtCookieName, "")
                .httpOnly(true)
                .secure(isHttps)
                .path("/api/auth/refresh")
                .maxAge(0)
                .sameSite(isHttps ? "Strict" : "Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok("Log out successful");
    }
}

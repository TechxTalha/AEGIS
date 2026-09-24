package com.aegis.core.machine.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "remote_machines")
public class RemoteMachine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String hostname;

    @Column(nullable = false)
    private int port = 22;

    @Column(nullable = false)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_type", nullable = false)
    private AuthType authType;

    @Column(name = "encrypted_credential", columnDefinition = "TEXT")
    private String encryptedCredential;

    @Column(name = "encrypted_passphrase", columnDefinition = "TEXT")
    private String encryptedPassphrase;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getHostname() { return hostname; }
    public void setHostname(String hostname) { this.hostname = hostname; }

    public int getPort() { return port; }
    public void setPort(int port) { this.port = port; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public AuthType getAuthType() { return authType; }
    public void setAuthType(AuthType authType) { this.authType = authType; }

    public String getEncryptedCredential() { return encryptedCredential; }
    public void setEncryptedCredential(String encryptedCredential) { this.encryptedCredential = encryptedCredential; }

    public String getEncryptedPassphrase() { return encryptedPassphrase; }
    public void setEncryptedPassphrase(String encryptedPassphrase) { this.encryptedPassphrase = encryptedPassphrase; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}

package com.aegis.core.auth;

import com.aegis.core.user.entity.Role;
import com.aegis.core.user.entity.User;
import com.aegis.core.user.RoleRepository;
import com.aegis.core.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
public class AdminInitializerService {

    private static final Logger logger = LoggerFactory.getLogger(AdminInitializerService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${aegis.admin.username:Hunter}")
    private String adminUsername;

    @Value("${aegis.admin.email:hunter@aegis.local}")
    private String adminEmail;

    @Value("${aegis.admin.password:Dragon456#}")
    private String adminPassword;

    public AdminInitializerService(UserRepository userRepository,
                                   RoleRepository roleRepository,
                                   PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initializeAdmin() {
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN not found in database!"));
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new IllegalStateException("ROLE_USER not found in database!"));

        Set<Role> roles = new HashSet<>();
        roles.add(adminRole);
        roles.add(userRole);

        userRepository.findByUsername(adminUsername).ifPresentOrElse(
            user -> {
                logger.info("Administrative account '{}' exists. Syncing password and roles...", adminUsername);
                user.setPasswordHash(passwordEncoder.encode(adminPassword));
                user.setRoles(roles);
                userRepository.save(user);
                logger.info("Administrative account '{}' synchronized.", adminUsername);
            },
            () -> {
                logger.info("No administrative account found for '{}'. Seeding initial administrator...", adminUsername);
                User adminUser = new User();
                adminUser.setUsername(adminUsername);
                adminUser.setEmail(adminEmail);
                adminUser.setPasswordHash(passwordEncoder.encode(adminPassword));
                adminUser.setRoles(roles);
                userRepository.save(adminUser);
                logger.info("Initial administrator account '{}' created successfully.", adminUsername);
            }
        );
    }
}

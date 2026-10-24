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

    @Value("${aegis.admin.username:admin}")
    private String adminUsername;

    @Value("${aegis.admin.email:admin@aegis.local}")
    private String adminEmail;

    @Value("${aegis.admin.password:Aegis@2026!Admin}")
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
        if (userRepository.findByUsername(adminUsername).isEmpty()) {
            logger.info("No administrative account found for '{}'. Seeding initial administrator...", adminUsername);

            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN not found in database!"));
            Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseThrow(() -> new IllegalStateException("ROLE_USER not found in database!"));

            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            roles.add(userRole);

            User adminUser = new User();
            adminUser.setUsername(adminUsername);
            adminUser.setEmail(adminEmail);
            adminUser.setPasswordHash(passwordEncoder.encode(adminPassword));
            adminUser.setRoles(roles);

            userRepository.save(adminUser);
            logger.info("Initial administrator account '{}' created successfully.", adminUsername);
        } else {
            logger.info("Administrative account '{}' already exists.", adminUsername);
        }
    }
}

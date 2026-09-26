CREATE TABLE audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    principal VARCHAR(255) NOT NULL,
    details TEXT,
    timestamp DATETIME NOT NULL
);

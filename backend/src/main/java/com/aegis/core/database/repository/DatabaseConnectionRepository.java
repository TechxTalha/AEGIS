package com.aegis.core.database.repository;

import com.aegis.core.database.model.DatabaseConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DatabaseConnectionRepository extends JpaRepository<DatabaseConnection, Long> {
}

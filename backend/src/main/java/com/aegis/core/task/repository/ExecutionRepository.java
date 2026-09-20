package com.aegis.core.task.repository;

import com.aegis.core.task.entity.Execution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExecutionRepository extends JpaRepository<Execution, Long> {
    List<Execution> findByTaskIdOrderByStartedAtDesc(Long taskId);
}

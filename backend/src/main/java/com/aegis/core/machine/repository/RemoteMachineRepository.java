package com.aegis.core.machine.repository;

import com.aegis.core.machine.model.RemoteMachine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RemoteMachineRepository extends JpaRepository<RemoteMachine, Long> {
    Optional<RemoteMachine> findByName(String name);
}

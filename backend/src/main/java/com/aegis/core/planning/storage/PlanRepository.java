package com.aegis.core.planning.storage;

import com.aegis.core.planning.model.Plan;

import java.util.Optional;

public interface PlanRepository {
    void save(Plan plan);
    Optional<Plan> findById(String id);
}

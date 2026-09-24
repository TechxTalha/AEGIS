package com.aegis.core.planning.storage;

import com.aegis.core.planning.model.Plan;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class InMemoryPlanStore implements PlanRepository {
    private final Map<String, Plan> store = new ConcurrentHashMap<>();

    @Override
    public void save(Plan plan) {
        if (plan.getId() == null) {
            throw new IllegalArgumentException("Plan ID cannot be null");
        }
        store.put(plan.getId(), plan);
    }

    @Override
    public Optional<Plan> findById(String id) {
        return Optional.ofNullable(store.get(id));
    }
}

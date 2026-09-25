package com.aegis.core.monitoring.engine;

import org.springframework.stereotype.Service;
import java.util.Random;

@Service
public class MetricsProviderService {
    
    private final Random random = new Random();

    public double getMetricValue(String metric) {
        switch (metric.toLowerCase()) {
            case "cpu_usage":
                return 40.0 + (random.nextDouble() * 20.0); // 40-60%
            case "memory_usage":
                return 60.0 + (random.nextDouble() * 15.0); // 60-75%
            case "disk_usage":
                return 80.0 + (random.nextDouble() * 10.0); // 80-90%
            case "error_rate":
                return random.nextDouble() * 5.0; // 0-5%
            default:
                return 0.0;
        }
    }
}

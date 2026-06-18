package com.hmilyld.fullstack.security;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class RateLimiter {

    private final ConcurrentHashMap<String, List<Long>> store = new ConcurrentHashMap<>();
    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MS = 60_000;

    public boolean isRateLimited(String key) {
        long now = System.currentTimeMillis();
        List<Long> timestamps = store.computeIfAbsent(key, k -> new CopyOnWriteArrayList<>());
        timestamps.removeIf(t -> now - t > WINDOW_MS);
        if (timestamps.size() >= MAX_ATTEMPTS) return true;
        timestamps.add(now);
        return false;
    }
}

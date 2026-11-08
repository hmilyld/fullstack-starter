package com.hmilyld.fullstack.security;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 按 key 的滑动窗口限流（登录、注册按 IP）。
 *
 * <p>阈值可配置，便于测试放宽；生产默认每分钟 5 次，与 Python 侧一致。
 */
@Component
public class RateLimiter {

  private final ConcurrentHashMap<String, List<Long>> store = new ConcurrentHashMap<>();

  @Value("${app.rate-limit.max-attempts:5}")
  private int maxAttempts = 5;

  @Value("${app.rate-limit.window-ms:60000}")
  private long windowMs = 60_000;

  private ScheduledExecutorService cleaner;

  @PostConstruct
  public void init() {
    // 每分钟清理一次过期的 key
    cleaner = Executors.newSingleThreadScheduledExecutor();
    cleaner.scheduleAtFixedRate(this::cleanup, 1, 1, TimeUnit.MINUTES);
  }

  @PreDestroy
  public void destroy() {
    if (cleaner != null) {
      cleaner.shutdown();
    }
  }

  public boolean isRateLimited(String key) {
    long now = System.currentTimeMillis();
    // 使用 compute 保证 check-then-add 原子性
    Boolean[] limited = new Boolean[1];
    store.compute(
        key,
        (k, existing) -> {
          List<Long> list = existing != null ? existing : new CopyOnWriteArrayList<>();
          list.removeIf(t -> now - t > windowMs);
          if (list.size() >= maxAttempts) {
            limited[0] = true;
          } else {
            list.add(now);
            limited[0] = false;
          }
          return list;
        });
    return Boolean.TRUE.equals(limited[0]);
  }

  /** 清理过期的 key，避免内存泄漏。 */
  private void cleanup() {
    long now = System.currentTimeMillis();
    Iterator<Map.Entry<String, List<Long>>> iterator = store.entrySet().iterator();
    while (iterator.hasNext()) {
      Map.Entry<String, List<Long>> entry = iterator.next();
      List<Long> timestamps = entry.getValue();
      timestamps.removeIf(t -> now - t > windowMs);
      if (timestamps.isEmpty()) {
        iterator.remove();
      }
    }
  }
}

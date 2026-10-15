package com.hmilyld.fullstack.config;

import jakarta.annotation.PreDestroy;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.springframework.stereotype.Component;

@Component
public class DataImportExecutor {

private final ExecutorService executor =
	Executors.newSingleThreadExecutor(Thread.ofVirtual().name("data-import-", 0).factory());

public void submit(Runnable task) {
	executor.submit(task);
}

@PreDestroy
public void shutdown() {
	executor.shutdown();
}
}

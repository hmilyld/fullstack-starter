package com.hmilyld.fullstack.config;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class DataOperationState {

public static class ImportJob {
	private final String id;
	private final String token;
	private final Long ownerId;
	private volatile String status;
	private volatile String message;
	private volatile int progress;
	private volatile long finishedAt;

	ImportJob(String id, String token, Long ownerId, String status, String message, int progress) {
	this.id = id;
	this.token = token;
	this.ownerId = ownerId;
	this.status = status;
	this.message = message;
	this.progress = progress;
	}

	public String id() {
	return id;
	}

	public String token() {
	return token;
	}

	public Long ownerId() {
	return ownerId;
	}

	public String status() {
	return status;
	}

	public String message() {
	return message;
	}

	public int progress() {
	return progress;
	}

	public long finishedAt() {
	return finishedAt;
	}

	public void markRunning() {
	status = "running";
	message = "正在校验并恢复数据";
	progress = 10;
	}
}

private static final long JOB_RETENTION_MILLIS = 60 * 60 * 1000L;

private final SecureRandom secureRandom = new SecureRandom();
private final Map<String, ImportJob> jobs = new ConcurrentHashMap<>();
private volatile boolean frozen = false;

public synchronized ImportJob beginJob(Long ownerId) {
	if (frozen) {
	return null;
	}
	evictFinishedJobs();
	ImportJob job = new ImportJob(randomToken(16), randomToken(32), ownerId, "queued", "等待导入", 0);
	jobs.put(job.id(), job);
	frozen = true;
	return job;
}

private void evictFinishedJobs() {
	long cutoff = System.currentTimeMillis() - JOB_RETENTION_MILLIS;
	jobs.values().removeIf(job -> job.finishedAt() > 0 && job.finishedAt() < cutoff);
}

public ImportJob getJob(String id, String token) {
	ImportJob job = jobs.get(id);
	if (job == null || !constantTimeEquals(job.token(), token)) {
	return null;
	}
	return job;
}

public synchronized void finishJob(ImportJob job, String status, String message) {
	job.status = status;
	job.message = message;
	job.progress = 100;
	job.finishedAt = System.currentTimeMillis();
	frozen = false;
}

public boolean isFrozen() {
	return frozen;
}

private String randomToken(int byteLength) {
	byte[] bytes = new byte[byteLength];
	secureRandom.nextBytes(bytes);
	return HexFormat.of().formatHex(bytes);
}

private boolean constantTimeEquals(String left, String right) {
	if (left == null || right == null) return false;
	return java.security.MessageDigest.isEqual(
		left.getBytes(java.nio.charset.StandardCharsets.UTF_8),
		right.getBytes(java.nio.charset.StandardCharsets.UTF_8));
}
}

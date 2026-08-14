package com.hmilyld.fullstack.service;

import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.common.PageResult;
import com.hmilyld.fullstack.entity.AuditLog;
import com.hmilyld.fullstack.entity.User;
import com.hmilyld.fullstack.repository.AuditLogRepository;
import com.hmilyld.fullstack.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

@Autowired private AuditLogRepository auditLogRepository;
@Autowired private UserRepository userRepository;

/** 记录一条审计日志，失败时静默，不影响业务 */
public void record(
	Long userId, String username, String action, String ip, String status, String detail) {
	try {
	AuditLog log = new AuditLog();
	log.setUserId(userId);
	log.setUsername(username != null ? username : "");
	log.setAction(action);
	log.setIp(ip != null ? ip : "");
	log.setStatus(status != null ? status : "success");
	log.setDetail(detail != null ? detail : "");
	log.setCreatedAt(LocalDateTime.now());
	auditLogRepository.save(log);
	} catch (Exception e) {
	// 审计失败不应影响主流程
	}
}

@Transactional(readOnly = true)
public ApiResponse<?> getLogs(
	Long userId,
	String status,
	String action,
	LocalDateTime startTime,
	LocalDateTime endTime,
	int page,
	int pageSize) {
	page = Math.max(1, page);
	pageSize = Math.min(100, Math.max(1, pageSize));

	Page<AuditLog> logPage =
		auditLogRepository.search(
			userId,
			status != null ? status : "",
			action != null ? action : "",
			startTime,
			endTime,
			PageRequest.of(page - 1, pageSize, Sort.by("createdAt").descending()));

	List<AuditLog> items = logPage.getContent();
	// 关联 users 表补全操作者用户名（查询不到时前端显示"未知"）
	Set<Long> userIds =
		items.stream()
			.map(AuditLog::getUserId)
			.filter(java.util.Objects::nonNull)
			.collect(Collectors.toSet());
	Map<Long, String> usernameMap = new HashMap<>();
	if (!userIds.isEmpty()) {
	for (User u : userRepository.findByIdIn(userIds)) {
		usernameMap.put(u.getId(), u.getUsername());
	}
	}

	List<Map<String, Object>> list = items.stream().map(log -> toOutMap(log, usernameMap)).toList();
	return ApiResponse.success(new PageResult<>(list, logPage.getTotalElements(), page, pageSize));
}

private Map<String, Object> toOutMap(AuditLog log, Map<Long, String> usernameMap) {
	Map<String, Object> map = new HashMap<>();
	map.put("id", String.valueOf(log.getId()));
	map.put("userId", log.getUserId() != null ? String.valueOf(log.getUserId()) : "");
	String username =
		log.getUsername() != null && !log.getUsername().isEmpty()
			? log.getUsername()
			: (log.getUserId() != null ? usernameMap.getOrDefault(log.getUserId(), "") : "");
	map.put("username", username);
	map.put("action", log.getAction());
	map.put("ip", log.getIp());
	map.put("status", log.getStatus());
	map.put("detail", log.getDetail() != null ? log.getDetail() : "");
	map.put("createdAt", log.getCreatedAt() != null ? log.getCreatedAt().toString() : "");
	return map;
}
}

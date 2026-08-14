package com.hmilyld.fullstack.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.service.AuditLogService;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

@Autowired private AuditLogService auditLogService;

@GetMapping("")
@SaCheckPermission("audit_logs")
public ApiResponse<?> getAuditLogs(
	@RequestParam(defaultValue = "") String userId,
	@RequestParam(defaultValue = "") String status,
	@RequestParam(defaultValue = "") String action,
	@RequestParam(defaultValue = "") String startTime,
	@RequestParam(defaultValue = "") String endTime,
	@RequestParam(defaultValue = "1") int page,
	@RequestParam(defaultValue = "10") int pageSize) {
	return auditLogService.getLogs(
		parseUserId(userId),
		status,
		action,
		parseTime(startTime),
		parseTime(endTime),
		page,
		pageSize);
}

private Long parseUserId(String userId) {
	try {
	return userId != null && !userId.isEmpty() ? Long.parseLong(userId) : null;
	} catch (NumberFormatException e) {
	return null;
	}
}

private LocalDateTime parseTime(String value) {
	if (value == null || value.isEmpty()) {
	return null;
	}
	try {
	return LocalDateTime.parse(value);
	} catch (Exception e) {
	return null;
	}
}
}

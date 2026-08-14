package com.hmilyld.fullstack.config;

import cn.dev33.satoken.stp.StpUtil;
import com.hmilyld.fullstack.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuditInterceptor implements HandlerInterceptor {

private static final Set<String> WRITE_METHODS = Set.of("POST", "PUT", "DELETE", "PATCH");

@Autowired private AuditLogService auditLogService;
@Autowired private AuditProperties auditProperties;

@Override
public void afterCompletion(
	HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
	try {
	String method = request.getMethod();
	boolean isWrite = WRITE_METHODS.contains(method);
	boolean isDenied = response.getStatus() == 403;
	if (!isWrite && !isDenied) {
		return;
	}

	String path = request.getRequestURI();
	if (!path.startsWith("/api/") || isExcluded(path)) {
		return;
	}

	Long userId = null;
	try {
		Object loginId = StpUtil.getLoginIdDefaultNull();
		if (loginId != null) {
		userId = Long.parseLong(loginId.toString());
		}
	} catch (Exception ignored) {
		// 未登录写操作，user_id 为空
	}

	String status = isDenied ? "permission_denied" : "success";
	auditLogService.record(userId, "", method + " " + path, getClientIp(request), status, "");
	} catch (Exception ignored) {
	// 审计失败不影响响应
	}
}

private boolean isExcluded(String path) {
	for (String prefix : auditProperties.getExcludePaths()) {
	if (path.equals(prefix) || path.startsWith(prefix.replaceAll("/+$", "") + "/")) {
		return true;
	}
	}
	return false;
}

private String getClientIp(HttpServletRequest request) {
	String ip = request.getHeader("X-Real-IP");
	if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
	ip = request.getHeader("X-Forwarded-For");
	}
	if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
	ip = request.getRemoteAddr();
	}
	if (ip != null && ip.contains(",")) {
	ip = ip.split(",")[0].trim();
	}
	return ip;
}
}

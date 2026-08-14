package com.hmilyld.fullstack.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.dto.LoginRequest;
import com.hmilyld.fullstack.dto.RegisterRequest;
import com.hmilyld.fullstack.security.RateLimiter;
import com.hmilyld.fullstack.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

@Autowired private AuthService authService;
@Autowired private RateLimiter rateLimiter;

@PostMapping("/login")
public ApiResponse<?> login(@RequestBody @Valid LoginRequest req, HttpServletRequest request) {
	String clientIp = getClientIp(request);
	if (rateLimiter.isRateLimited("login:" + clientIp)) {
	return ApiResponse.error("登录尝试过于频繁，请稍后再试");
	}
	return authService.login(req.getAccount(), req.getPassword(), clientIp);
}

@PostMapping("/register")
public ApiResponse<?> register(
	@RequestBody @Valid RegisterRequest req, HttpServletRequest request) {
	String clientIp = getClientIp(request);
	if (rateLimiter.isRateLimited("register:" + clientIp)) {
	return ApiResponse.error("注册尝试过于频繁，请稍后再试");
	}
	return authService.register(req.getUsername(), req.getEmail(), req.getPassword(), clientIp);
}

@PostMapping("/logout")
public ApiResponse<?> logout(HttpServletRequest request) {
	Long userId = null;
	try {
	Object loginId = StpUtil.getLoginIdDefaultNull();
	if (loginId != null) {
		userId = Long.parseLong(loginId.toString());
	}
	} catch (Exception ignored) {
	// 未登录时直接登出
	}
	authService.logout(userId, getClientIp(request));
	return ApiResponse.success();
}

private String getClientIp(HttpServletRequest request) {
	// 优先读取 nginx 写入的 X-Real-IP(由 $remote_addr 覆盖写入，不可伪造)
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

package com.hmilyld.fullstack.service;

import cn.dev33.satoken.stp.StpUtil;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.dto.LoginResponse;
import com.hmilyld.fullstack.entity.SystemConfig;
import com.hmilyld.fullstack.entity.User;
import com.hmilyld.fullstack.repository.RolePermissionRepository;
import com.hmilyld.fullstack.repository.SystemConfigRepository;
import com.hmilyld.fullstack.repository.UserRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

@Autowired private UserRepository userRepository;
@Autowired private RolePermissionRepository rolePermissionRepository;
@Autowired private SystemConfigRepository systemConfigRepository;

private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

public ApiResponse<?> login(String account, String password) {
	User user =
		userRepository
			.findByUsername(account)
			.orElseGet(() -> userRepository.findByEmail(account).orElse(null));

	if (user == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
	return ApiResponse.error("账号或密码错误");
	}

	if ("pending_review".equals(user.getRoleId())) {
	return ApiResponse.error("账号正在审核中，请等待管理员批准");
	}

	SystemConfig config = systemConfigRepository.findById(1L).orElse(new SystemConfig());
	if (Boolean.TRUE.equals(config.getMaintenanceEnabled()) && !"admin".equals(user.getRoleId())) {
	return ApiResponse.error(
		config.getMaintenanceMessage() != null && !config.getMaintenanceMessage().isEmpty()
			? config.getMaintenanceMessage()
			: "系统维护中");
	}

	StpUtil.login(user.getId());
	String token = StpUtil.getTokenValue();

	List<String> permissions;
	if ("admin".equals(user.getRoleId())) {
	permissions = rolePermissionRepository.findAllPermissionCodes();
	} else {
	permissions = rolePermissionRepository.findPermissionCodesByRoleId(user.getRoleId());
	}

	LoginResponse.AuthUser authUser =
		new LoginResponse.AuthUser(
			String.valueOf(user.getId()),
			user.getName(),
			user.getEmail(),
			user.getAvatar() != null ? user.getAvatar() : "",
			user.getRoleId(),
			permissions);

	return ApiResponse.success(new LoginResponse(token, authUser));
}

@Transactional
public ApiResponse<?> register(String username, String email, String password) {
	SystemConfig config = systemConfigRepository.findById(1L).orElse(new SystemConfig());
	if (!Boolean.TRUE.equals(config.getOpenRegistration())) {
	return ApiResponse.error("注册已关闭");
	}

	if (userRepository.findByUsername(username).isPresent()) {
	return ApiResponse.error("用户名已存在");
	}
	if (userRepository.findByEmail(email).isPresent()) {
	return ApiResponse.error("邮箱已被注册");
	}

	String roleId = Boolean.TRUE.equals(config.getManualReview()) ? "pending_review" : "user";

	User user = new User();
	user.setUsername(username);
	user.setName(username);
	user.setEmail(email);
	user.setRoleId(roleId);
	user.setPasswordHash(passwordEncoder.encode(password));
	user.setAvatar("");
	userRepository.save(user);

	if ("pending_review".equals(roleId)) {
	return ApiResponse.success("注册成功，请等待管理员审核");
	}

	StpUtil.login(user.getId());
	String token = StpUtil.getTokenValue();

	List<String> permissions =
		rolePermissionRepository.findPermissionCodesByRoleId(user.getRoleId());

	LoginResponse.AuthUser authUser =
		new LoginResponse.AuthUser(
			String.valueOf(user.getId()),
			user.getName(),
			user.getEmail(),
			"",
			user.getRoleId(),
			permissions);

	return ApiResponse.success(new LoginResponse(token, authUser));
}

public void logout() {
	StpUtil.logout();
}
}

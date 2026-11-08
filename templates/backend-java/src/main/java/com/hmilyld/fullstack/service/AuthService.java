package com.hmilyld.fullstack.service;

import cn.dev33.satoken.stp.StpUtil;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.common.AppException;
import com.hmilyld.fullstack.common.ConflictException;
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

/** 认证领域：登录、注册、登出。 */
@Service
public class AuthService {

  private static final String PENDING_REVIEW_ROLE_ID = "pending_review";
  private static final String ADMIN_ROLE_ID = "admin";
  private static final String DEFAULT_ROLE_ID = "user";

  @Autowired private UserRepository userRepository;
  @Autowired private RolePermissionRepository rolePermissionRepository;
  @Autowired private SystemConfigRepository systemConfigRepository;
  @Autowired private AuditLogService auditLogService;
  @Autowired private AppStateService appStateService;
  @Autowired private TokenVersionService tokenVersionService;

  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  public ApiResponse<?> login(String account, String password, String clientIp) {
    User user =
        userRepository
            .findByUsername(account)
            .orElseGet(() -> userRepository.findByEmail(account).orElse(null));

    if (user == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
      auditLogService.record(null, account, "login", clientIp, "fail", "账号或密码错误");
      throw new AppException("账号或密码错误");
    }

    if (PENDING_REVIEW_ROLE_ID.equals(user.getRoleId())) {
      auditLogService.record(
          user.getId(), user.getUsername(), "login", clientIp, "fail", "账号正在审核中");
      throw new AppException("账号正在审核中，请等待管理员批准");
    }

    SystemConfig config = systemConfigRepository.findById(1L).orElse(new SystemConfig());
    if (Boolean.TRUE.equals(config.getMaintenanceEnabled())
        && !ADMIN_ROLE_ID.equals(user.getRoleId())) {
      String message =
          config.getMaintenanceMessage() != null && !config.getMaintenanceMessage().isEmpty()
              ? config.getMaintenanceMessage()
              : "系统维护中";
      auditLogService.record(user.getId(), user.getUsername(), "login", clientIp, "fail", message);
      throw new AppException(message);
    }

    StpUtil.login(user.getId());
    StpUtil.getSession().set("authEpoch", appStateService.getSessionEpoch());
    String token = StpUtil.getTokenValue();

    auditLogService.record(user.getId(), user.getUsername(), "login", clientIp, "success", "");

    return ApiResponse.success(new LoginResponse(token, buildAuthUser(user)));
  }

  @Transactional
  public ApiResponse<?> register(String username, String email, String password, String clientIp) {
    SystemConfig config = systemConfigRepository.findById(1L).orElse(new SystemConfig());
    if (!Boolean.TRUE.equals(config.getOpenRegistration())) {
      auditLogService.record(null, username, "register", clientIp, "fail", "注册已关闭");
      throw new AppException("注册已关闭");
    }

    if (userRepository.findByUsername(username).isPresent()) {
      auditLogService.record(null, username, "register", clientIp, "fail", "用户名已存在");
      throw new ConflictException("用户名已存在");
    }
    if (userRepository.findByEmail(email).isPresent()) {
      auditLogService.record(null, username, "register", clientIp, "fail", "邮箱已被注册");
      throw new ConflictException("邮箱已被注册");
    }

    String roleId =
        Boolean.TRUE.equals(config.getManualReview()) ? PENDING_REVIEW_ROLE_ID : DEFAULT_ROLE_ID;

    User user = new User();
    user.setUsername(username);
    user.setName(username);
    user.setEmail(email);
    user.setRoleId(roleId);
    user.setPasswordHash(passwordEncoder.encode(password));
    user.setAvatar("");
    userRepository.save(user);

    auditLogService.record(user.getId(), user.getUsername(), "register", clientIp, "success", "");

    if (PENDING_REVIEW_ROLE_ID.equals(roleId)) {
      // 契约要求：待审核时 data 为 null，message 说明原因
      return ApiResponse.success(null);
    }

    StpUtil.login(user.getId());
    StpUtil.getSession().set("authEpoch", appStateService.getSessionEpoch());
    String token = StpUtil.getTokenValue();

    return ApiResponse.success(new LoginResponse(token, buildAuthUser(user)));
  }

  /** 登出：Sa-Token 会话立即失效，并记录审计。 */
  public void logout(Long userId, String clientIp) {
    try {
      if (userId != null) {
        User user = userRepository.findById(userId).orElse(null);
        auditLogService.record(
            userId, user != null ? user.getUsername() : "", "logout", clientIp, "success", "");
      }
    } finally {
      StpUtil.logout();
    }
  }

  private LoginResponse.AuthUser buildAuthUser(User user) {
    List<String> permissions =
        ADMIN_ROLE_ID.equals(user.getRoleId())
            ? rolePermissionRepository.findAllPermissionCodes()
            : rolePermissionRepository.findPermissionCodesByRoleId(user.getRoleId());
    return new LoginResponse.AuthUser(
        String.valueOf(user.getId()),
        user.getName(),
        user.getEmail(),
        user.getAvatar() != null ? user.getAvatar() : "",
        user.getRoleId(),
        permissions);
  }
}

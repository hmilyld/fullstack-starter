package com.hmilyld.fullstack.service;

import cn.dev33.satoken.stp.StpUtil;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.common.ConflictException;
import com.hmilyld.fullstack.common.ForbiddenException;
import com.hmilyld.fullstack.common.InvalidOperationException;
import com.hmilyld.fullstack.common.NotFoundException;
import com.hmilyld.fullstack.common.PageResult;
import com.hmilyld.fullstack.dto.BatchRoleResult;
import com.hmilyld.fullstack.dto.ChangePasswordRequest;
import com.hmilyld.fullstack.dto.UpdateMeRequest;
import com.hmilyld.fullstack.dto.UserCreateRequest;
import com.hmilyld.fullstack.dto.UserResponse;
import com.hmilyld.fullstack.dto.UserUpdateRequest;
import com.hmilyld.fullstack.entity.User;
import com.hmilyld.fullstack.repository.UserRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 用户领域。
 *
 * <p>失败一律抛异常，由 {@code GlobalExceptionHandler} 映射为信封， 从而保证 {@code @Transactional} 回滚——不再「先写库再返回
 * error」。
 */
@Service
public class UserService {

  /** 唯一允许的角色名常量：管理员账号保护规则。 */
  public static final String ADMIN_ROLE_ID = "admin";

  public static final String DEFAULT_ROLE_ID = "user";

  @Autowired private UserRepository userRepository;

  @Autowired private TokenVersionService tokenVersionService;

  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  public ApiResponse<PageResult<UserResponse>> getUsers(String search, int page, int pageSize) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));

    Page<User> userPage =
        userRepository.search(
            search, PageRequest.of(page - 1, pageSize, Sort.by("id").ascending()));

    PageResult<UserResponse> result =
        new PageResult<>(
            userPage.getContent().stream().map(UserService::toResponse).toList(),
            userPage.getTotalElements(),
            page,
            pageSize);
    return ApiResponse.success(result);
  }

  public ApiResponse<UserResponse> getUser(Long id) {
    User user = userRepository.findById(id).orElseThrow(() -> new NotFoundException("用户不存在"));
    return ApiResponse.success(toResponse(user));
  }

  @Transactional
  public ApiResponse<UserResponse> createUser(UserCreateRequest req) {
    if (userRepository.findByUsername(req.getUsername()).isPresent()) {
      throw new ConflictException("用户名已存在");
    }
    if (userRepository.findByEmail(req.getEmail()).isPresent()) {
      throw new ConflictException("邮箱已被注册");
    }
    // 创建非默认角色的用户需要角色维护权限，避免 users.create 单独提权
    if (req.getRoleId() != null
        && !DEFAULT_ROLE_ID.equals(req.getRoleId())
        && !StpUtil.hasPermission("users.assign_role")) {
      throw new ForbiddenException();
    }

    User user = new User();
    user.setUsername(req.getUsername());
    user.setName(req.getName());
    user.setEmail(req.getEmail());
    user.setRoleId(req.getRoleId());
    user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
    user.setAvatar("");
    userRepository.save(user);

    return ApiResponse.success(toResponse(user));
  }

  @Transactional
  public ApiResponse<UserResponse> updateUser(Long id, UserUpdateRequest req) {
    User user = userRepository.findById(id).orElseThrow(() -> new NotFoundException("用户不存在"));

    Long operatorId = StpUtil.getLoginIdAsLong();
    boolean isSelf = user.getId().equals(operatorId);
    boolean isAdmin = ADMIN_ROLE_ID.equals(user.getRoleId());

    // 非管理员不能修改管理员用户
    if (isAdmin && !isSelf && !isOperatorAdmin()) {
      throw new ForbiddenException();
    }

    if (req.getRoleId() != null && !req.getRoleId().equals(user.getRoleId())) {
      if (isSelf) {
        throw new InvalidOperationException(isAdmin ? "不能降级自己的管理员角色" : "不能修改自己的角色");
      }
      if (!StpUtil.hasPermission("users.assign_role")) {
        throw new ForbiddenException();
      }
      user.setRoleId(req.getRoleId());
    }

    if (req.getUsername() != null) user.setUsername(req.getUsername());
    if (req.getName() != null) user.setName(req.getName());
    if (req.getEmail() != null) user.setEmail(req.getEmail());
    if (req.getAvatar() != null) user.setAvatar(req.getAvatar());
    userRepository.save(user);
    return ApiResponse.success(toResponse(user));
  }

  @Transactional
  public ApiResponse<Void> deleteUser(Long id) {
    User user = userRepository.findById(id).orElseThrow(() -> new NotFoundException("用户不存在"));

    Long operatorId = StpUtil.getLoginIdAsLong();
    if (user.getId().equals(operatorId)) {
      throw new InvalidOperationException("不能删除自己");
    }

    if (ADMIN_ROLE_ID.equals(user.getRoleId())) {
      if (!isOperatorAdmin()) {
        throw new ForbiddenException();
      }
      if (userRepository.countByRoleId(ADMIN_ROLE_ID) <= 1) {
        throw new InvalidOperationException("不能删除最后一个管理员");
      }
    }

    userRepository.delete(user);
    return ApiResponse.success();
  }

  @Transactional
  public ApiResponse<Void> resetPassword(Long id, String newPassword) {
    User user = userRepository.findById(id).orElseThrow(() -> new NotFoundException("用户不存在"));
    if (ADMIN_ROLE_ID.equals(user.getRoleId()) && !isOperatorAdmin()) {
      throw new ForbiddenException();
    }
    user.setPasswordHash(passwordEncoder.encode(newPassword));
    userRepository.save(user);
    // 管理员重置密码后，该用户所有既有令牌失效
    tokenVersionService.revokeSessions(user);
    return ApiResponse.success();
  }

  @Transactional
  public ApiResponse<BatchRoleResult> batchUpdateRole(
      BatchRoleUpdateRequestHolder req, Long currentUserId) {
    int applied = 0;
    for (Long userId : req.userIds()) {
      User user = userRepository.findById(userId).orElse(null);
      if (user == null) continue;
      // 跳过自己，不允许批量修改自己的角色
      if (user.getId().equals(currentUserId)) continue;
      // 管理员角色不可被降级（除非操作者也是管理员）
      if (ADMIN_ROLE_ID.equals(user.getRoleId()) && !isOperatorAdmin()) continue;
      user.setRoleId(req.roleId());
      userRepository.save(user);
      applied++;
    }
    return ApiResponse.success(new BatchRoleResult(applied));
  }

  @Transactional
  public ApiResponse<UserResponse> updateMe(Long userId, UpdateMeRequest req) {
    User user = userRepository.findById(userId).orElseThrow(() -> new NotFoundException("用户不存在"));
    if (req.getEmail() != null && !req.getEmail().equals(user.getEmail())) {
      if (userRepository.findByEmail(req.getEmail()).isPresent()) {
        throw new ConflictException("邮箱已被注册");
      }
      user.setEmail(req.getEmail());
    }
    if (req.getName() != null) user.setName(req.getName());
    userRepository.save(user);
    return ApiResponse.success(toResponse(user));
  }

  @Transactional
  public ApiResponse<Void> changePassword(Long userId, ChangePasswordRequest req) {
    User user = userRepository.findById(userId).orElseThrow(() -> new NotFoundException("用户不存在"));
    if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
      throw new InvalidOperationException("当前密码错误");
    }
    user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
    userRepository.save(user);
    // 改密后吊销该用户所有既有令牌
    tokenVersionService.revokeSessions(user);
    return ApiResponse.success();
  }

  /** 是否以管理员身份操作。角色名判断集中在此处。 */
  private boolean isOperatorAdmin() {
    User operator = userRepository.findById(StpUtil.getLoginIdAsLong()).orElse(null);
    return operator != null && ADMIN_ROLE_ID.equals(operator.getRoleId());
  }

  public static UserResponse toResponse(User user) {
    return new UserResponse(
        String.valueOf(user.getId()),
        user.getUsername(),
        user.getName(),
        user.getEmail(),
        user.getRoleId(),
        user.getAvatar() != null ? user.getAvatar() : "");
  }

  /** 批量改角色的入参载体，避免 service 依赖 controller 层。 */
  public record BatchRoleUpdateRequestHolder(List<Long> userIds, String roleId) {}
}

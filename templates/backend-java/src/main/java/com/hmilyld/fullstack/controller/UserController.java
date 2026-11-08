package com.hmilyld.fullstack.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import cn.dev33.satoken.annotation.SaMode;
import cn.dev33.satoken.stp.StpUtil;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.common.PageResult;
import com.hmilyld.fullstack.dto.BatchRoleResult;
import com.hmilyld.fullstack.dto.BatchRoleUpdateRequest;
import com.hmilyld.fullstack.dto.ChangePasswordRequest;
import com.hmilyld.fullstack.dto.ResetPasswordRequest;
import com.hmilyld.fullstack.dto.UpdateMeRequest;
import com.hmilyld.fullstack.dto.UserCreateRequest;
import com.hmilyld.fullstack.dto.UserResponse;
import com.hmilyld.fullstack.dto.UserUpdateRequest;
import com.hmilyld.fullstack.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

  @Autowired private UserService userService;

  @GetMapping("")
  @SaCheckPermission("users")
  public ApiResponse<PageResult<UserResponse>> getUsers(
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "10") int pageSize) {
    return userService.getUsers(search, page, pageSize);
  }

  @GetMapping("/{id}")
  @SaCheckPermission("users")
  public ApiResponse<UserResponse> getUser(@PathVariable Long id) {
    return userService.getUser(id);
  }

  /** 契约：users.create 即可创建默认角色用户；非默认角色需 users.assign_role（在 service 内校验）。 */
  @PostMapping("")
  @SaCheckPermission("users.create")
  public ApiResponse<UserResponse> createUser(@RequestBody @Valid UserCreateRequest req) {
    return userService.createUser(req);
  }

  @PutMapping("/{id}")
  @SaCheckPermission(
      value = {"users.edit", "users.assign_role"},
      mode = SaMode.OR)
  public ApiResponse<UserResponse> updateUser(
      @PathVariable Long id, @RequestBody UserUpdateRequest req) {
    return userService.updateUser(id, req);
  }

  @DeleteMapping("/{id}")
  @SaCheckPermission("users.delete")
  public ApiResponse<Void> deleteUser(@PathVariable Long id) {
    return userService.deleteUser(id);
  }

  @PutMapping("/{id}/reset-password")
  @SaCheckPermission("users.edit")
  public ApiResponse<Void> resetPassword(
      @PathVariable Long id, @RequestBody @Valid ResetPasswordRequest req) {
    return userService.resetPassword(id, req.getNewPassword());
  }

  @PostMapping("/batch-role")
  @SaCheckPermission(
      value = {"users.edit", "users.assign_role"},
      mode = SaMode.OR)
  public ApiResponse<BatchRoleResult> batchUpdateRole(
      @RequestBody @Valid BatchRoleUpdateRequest req) {
    Long currentUserId = StpUtil.getLoginIdAsLong();
    return userService.batchUpdateRole(
        new UserService.BatchRoleUpdateRequestHolder(req.getUserIds(), req.getRoleId()),
        currentUserId);
  }

  @PutMapping("/me")
  public ApiResponse<UserResponse> updateMe(@RequestBody @Valid UpdateMeRequest req) {
    Long userId = StpUtil.getLoginIdAsLong();
    return userService.updateMe(userId, req);
  }

  @PutMapping("/me/password")
  public ApiResponse<Void> changePassword(@RequestBody @Valid ChangePasswordRequest req) {
    Long userId = StpUtil.getLoginIdAsLong();
    return userService.changePassword(userId, req);
  }
}

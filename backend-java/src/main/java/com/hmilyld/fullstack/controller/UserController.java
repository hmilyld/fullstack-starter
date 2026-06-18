package com.hmilyld.fullstack.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import cn.dev33.satoken.stp.StpUtil;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.dto.*;
import com.hmilyld.fullstack.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("")
    @SaCheckPermission("users")
    public ApiResponse<?> getUsers(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        return userService.getUsers(search, page, pageSize);
    }

    @GetMapping("/{id}")
    @SaCheckPermission("users")
    public ApiResponse<?> getUser(@PathVariable Long id) {
        return userService.getUser(id);
    }

    @PostMapping("")
    @SaCheckPermission("users.create")
    public ApiResponse<?> createUser(@RequestBody @Valid UserCreateRequest req) {
        return userService.createUser(req);
    }

    @PutMapping("/{id}")
    @SaCheckPermission("users.edit")
    public ApiResponse<?> updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest req) {
        return userService.updateUser(id, req);
    }

    @DeleteMapping("/{id}")
    @SaCheckPermission("users.delete")
    public ApiResponse<?> deleteUser(@PathVariable Long id) {
        return userService.deleteUser(id);
    }

    @PutMapping("/{id}/reset-password")
    @SaCheckPermission("users.edit")
    public ApiResponse<?> resetPassword(@PathVariable Long id, @RequestBody @Valid ResetPasswordRequest req) {
        return userService.resetPassword(id, req.getNewPassword());
    }

    @PostMapping("/batch-role")
    @SaCheckPermission("users.edit")
    public ApiResponse<?> batchUpdateRole(@RequestBody @Valid BatchRoleUpdateRequest req) {
        Long currentUserId = StpUtil.getLoginIdAsLong();
        return userService.batchUpdateRole(req, currentUserId);
    }

    @PutMapping("/me")
    public ApiResponse<?> updateMe(@RequestBody @Valid UpdateMeRequest req) {
        Long userId = StpUtil.getLoginIdAsLong();
        return userService.updateMe(userId, req);
    }

    @PutMapping("/me/password")
    public ApiResponse<?> changePassword(@RequestBody @Valid ChangePasswordRequest req) {
        Long userId = StpUtil.getLoginIdAsLong();
        return userService.changePassword(userId, req);
    }
}

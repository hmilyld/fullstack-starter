package com.hmilyld.fullstack.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.dto.PermissionCreateRequest;
import com.hmilyld.fullstack.dto.PermissionUpdateRequest;
import com.hmilyld.fullstack.service.PermissionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/permissions")
public class PermissionController {

    @Autowired
    private PermissionService permissionService;

    @GetMapping("")
    @SaCheckPermission("permissions")
    public ApiResponse<?> getPermissions(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String parent) {
        return permissionService.getPermissions(type, parent);
    }

    @PostMapping("")
    @SaCheckPermission("permissions.create")
    public ApiResponse<?> createPermission(@RequestBody @Valid PermissionCreateRequest req) {
        return permissionService.createPermission(req);
    }

    @PutMapping("/{code}")
    @SaCheckPermission("permissions.edit")
    public ApiResponse<?> updatePermission(@PathVariable String code, @RequestBody PermissionUpdateRequest req) {
        return permissionService.updatePermission(code, req);
    }

    @DeleteMapping("/{code}")
    @SaCheckPermission("permissions.delete")
    public ApiResponse<?> deletePermission(@PathVariable String code) {
        return permissionService.deletePermission(code);
    }
}

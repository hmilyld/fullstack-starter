package com.hmilyld.fullstack.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.dto.PermissionCreateRequest;
import com.hmilyld.fullstack.dto.PermissionResponse;
import com.hmilyld.fullstack.dto.PermissionSyncResponse;
import com.hmilyld.fullstack.dto.PermissionUpdateRequest;
import com.hmilyld.fullstack.service.PermissionService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/permissions")
public class PermissionController {

  @Autowired private PermissionService permissionService;

  @GetMapping("")
  @SaCheckPermission("permissions")
  public ApiResponse<List<PermissionResponse>> getPermissions(
      @RequestParam(required = false) String type, @RequestParam(required = false) String parent) {
    return permissionService.getPermissions(type, parent);
  }

  @PostMapping("")
  @SaCheckPermission("permissions.create")
  public ApiResponse<PermissionResponse> createPermission(
      @RequestBody @Valid PermissionCreateRequest req) {
    return permissionService.createPermission(req);
  }

  @PostMapping("/sync")
  @SaCheckPermission("permissions.create")
  public ApiResponse<PermissionSyncResponse> syncPermissions() {
    return permissionService.syncPermissions();
  }

  @PutMapping("/{code}")
  @SaCheckPermission("permissions.edit")
  public ApiResponse<PermissionResponse> updatePermission(
      @PathVariable String code, @RequestBody PermissionUpdateRequest req) {
    return permissionService.updatePermission(code, req);
  }

  @DeleteMapping("/{code}")
  @SaCheckPermission("permissions.delete")
  public ApiResponse<Void> deletePermission(@PathVariable String code) {
    return permissionService.deletePermission(code);
  }
}

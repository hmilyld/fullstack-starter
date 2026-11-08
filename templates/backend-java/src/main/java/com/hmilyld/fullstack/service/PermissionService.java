package com.hmilyld.fullstack.service;

import com.hmilyld.fullstack.catalog.PermissionCatalog;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.common.ConflictException;
import com.hmilyld.fullstack.common.InvalidOperationException;
import com.hmilyld.fullstack.common.NotFoundException;
import com.hmilyld.fullstack.dto.PermissionCreateRequest;
import com.hmilyld.fullstack.dto.PermissionResponse;
import com.hmilyld.fullstack.dto.PermissionSyncResponse;
import com.hmilyld.fullstack.dto.PermissionUpdateRequest;
import com.hmilyld.fullstack.entity.Permission;
import com.hmilyld.fullstack.repository.PermissionRepository;
import com.hmilyld.fullstack.repository.RolePermissionRepository;
import com.hmilyld.fullstack.repository.RoleRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 权限领域。
 *
 * <p>{@code menu} 类型权限的增删改一律拒绝：它们由菜单管理维护， 以保证 {@code menu_items} 与 {@code permissions} 不会脱节。
 */
@Service
public class PermissionService {

  private static final String MENU_TYPE = "menu";

  @Autowired private PermissionRepository permissionRepository;
  @Autowired private RolePermissionRepository rolePermissionRepository;
  @Autowired private RoleRepository roleRepository;

  public ApiResponse<List<PermissionResponse>> getPermissions(String type, String parent) {
    List<Permission> permissions;
    if (type != null && parent != null) {
      permissions = permissionRepository.findByTypeAndParent(type, parent);
    } else if (type != null) {
      permissions = permissionRepository.findByType(type);
    } else if (parent != null) {
      permissions = permissionRepository.findByParent(parent);
    } else {
      permissions = permissionRepository.findAll();
    }

    List<PermissionResponse> list =
        permissions.stream()
            .sorted(java.util.Comparator.comparing(Permission::getCode))
            .map(p -> new PermissionResponse(p.getCode(), p.getName(), p.getType(), p.getParent()))
            .toList();
    return ApiResponse.success(list);
  }

  @Transactional
  public ApiResponse<PermissionResponse> createPermission(PermissionCreateRequest req) {
    if (MENU_TYPE.equals(req.getType())) {
      throw new InvalidOperationException("请通过菜单管理创建菜单");
    }
    if (permissionRepository.findById(req.getCode()).isPresent()) {
      throw new ConflictException("权限编码已存在");
    }
    if (req.getParent() != null) {
      assertParentIsMenu(req.getParent());
    }

    Permission perm = new Permission();
    perm.setCode(req.getCode());
    perm.setName(req.getName());
    perm.setType(req.getType());
    perm.setParent(req.getParent());
    permissionRepository.save(perm);

    return ApiResponse.success(
        new PermissionResponse(perm.getCode(), perm.getName(), perm.getType(), perm.getParent()));
  }

  @Transactional
  public ApiResponse<PermissionResponse> updatePermission(
      String code, PermissionUpdateRequest req) {
    Permission perm =
        permissionRepository.findById(code).orElseThrow(() -> new NotFoundException("权限不存在"));
    if (MENU_TYPE.equals(perm.getType())) {
      throw new InvalidOperationException("请通过菜单管理编辑菜单");
    }
    if (req.getParent() != null) {
      assertParentIsMenu(req.getParent());
    }
    if (req.getName() != null) perm.setName(req.getName());
    if (req.getParent() != null) perm.setParent(req.getParent());
    permissionRepository.save(perm);

    return ApiResponse.success(
        new PermissionResponse(perm.getCode(), perm.getName(), perm.getType(), perm.getParent()));
  }

  @Transactional
  public ApiResponse<Void> deletePermission(String code) {
    Permission perm =
        permissionRepository.findById(code).orElseThrow(() -> new NotFoundException("权限不存在"));
    if (MENU_TYPE.equals(perm.getType())) {
      throw new InvalidOperationException("请通过菜单管理删除菜单");
    }
    rolePermissionRepository.deleteByPermissionCode(code);
    permissionRepository.delete(perm);
    return ApiResponse.success();
  }

  @Transactional
  public ApiResponse<PermissionSyncResponse> syncPermissions() {
    List<String> added = new ArrayList<>();
    List<String> updated = new ArrayList<>();

    for (PermissionCatalog.PermissionItem item : PermissionCatalog.ALL_PERMISSIONS) {
      Permission perm = permissionRepository.findById(item.code()).orElse(null);
      if (perm == null) {
        Permission p = new Permission();
        p.setCode(item.code());
        p.setName(item.name());
        p.setType(item.type());
        p.setParent(item.parent());
        permissionRepository.save(p);
        added.add(item.code());
      } else if (!item.name().equals(perm.getName())
          || !java.util.Objects.equals(item.parent(), perm.getParent())) {
        perm.setName(item.name());
        perm.setParent(item.parent());
        permissionRepository.save(perm);
        updated.add(item.code());
      }
    }

    List<String> granted = new ArrayList<>();
    if (roleRepository.findById("admin").isPresent()) {
      List<String> existing = rolePermissionRepository.findPermissionCodesByRoleId("admin");
      for (PermissionCatalog.PermissionItem item : PermissionCatalog.ALL_PERMISSIONS) {
        if (!existing.contains(item.code())) {
          com.hmilyld.fullstack.entity.RolePermission rp =
              new com.hmilyld.fullstack.entity.RolePermission();
          rp.setRoleId("admin");
          rp.setPermissionCode(item.code());
          rolePermissionRepository.save(rp);
          granted.add(item.code());
        }
      }
    }

    return ApiResponse.success(new PermissionSyncResponse(added, updated, granted));
  }

  private void assertParentIsMenu(String parent) {
    Permission record = permissionRepository.findById(parent).orElse(null);
    if (record == null || !MENU_TYPE.equals(record.getType())) {
      throw new InvalidOperationException("所属菜单不存在");
    }
  }
}

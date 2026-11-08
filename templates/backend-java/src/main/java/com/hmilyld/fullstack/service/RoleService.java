package com.hmilyld.fullstack.service;

import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.common.InvalidOperationException;
import com.hmilyld.fullstack.common.NotFoundException;
import com.hmilyld.fullstack.common.PageResult;
import com.hmilyld.fullstack.dto.RoleCreateRequest;
import com.hmilyld.fullstack.dto.RoleResponse;
import com.hmilyld.fullstack.dto.RoleUpdateRequest;
import com.hmilyld.fullstack.entity.Role;
import com.hmilyld.fullstack.entity.RolePermission;
import com.hmilyld.fullstack.repository.RolePermissionRepository;
import com.hmilyld.fullstack.repository.RoleRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 角色领域。 */
@Service
public class RoleService {

  @Autowired private RoleRepository roleRepository;
  @Autowired private RolePermissionRepository rolePermissionRepository;

  public ApiResponse<?> getRoles(String search, int page, int pageSize) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));

    Page<Role> rolePage =
        roleRepository.search(
            search, PageRequest.of(page - 1, pageSize, Sort.by("id").ascending()));

    List<RoleResponse> list =
        rolePage.getContent().stream()
            .map(
                role ->
                    new RoleResponse(
                        role.getId(),
                        role.getName(),
                        role.getDescription() != null ? role.getDescription() : "",
                        rolePermissionRepository.findPermissionCodesByRoleId(role.getId()),
                        Boolean.TRUE.equals(role.getPreset())))
            .toList();

    return ApiResponse.success(new PageResult<>(list, rolePage.getTotalElements(), page, pageSize));
  }

  @Transactional
  public ApiResponse<?> createRole(RoleCreateRequest req) {
    Role role = new Role();
    role.setId(UUID.randomUUID().toString().substring(0, 8));
    role.setName(req.getName());
    role.setDescription(req.getDescription() != null ? req.getDescription() : "");
    role.setPreset(false);
    roleRepository.save(role);

    List<String> permissions = req.getPermissions() != null ? req.getPermissions() : List.of();
    for (String permCode : permissions) {
      RolePermission rp = new RolePermission();
      rp.setRoleId(role.getId());
      rp.setPermissionCode(permCode);
      rolePermissionRepository.save(rp);
    }

    return ApiResponse.success(
        new RoleResponse(
            role.getId(),
            role.getName(),
            role.getDescription(),
            rolePermissionRepository.findPermissionCodesByRoleId(role.getId()),
            false));
  }

  @Transactional
  public ApiResponse<?> updateRole(String id, RoleUpdateRequest req) {
    Role role = roleRepository.findById(id).orElseThrow(() -> new NotFoundException("角色不存在"));

    if (req.getName() != null) role.setName(req.getName());
    if (req.getDescription() != null) role.setDescription(req.getDescription());
    roleRepository.save(role);

    if (req.getPermissions() != null) {
      rolePermissionRepository.deleteByRoleId(id);
      for (String permCode : req.getPermissions()) {
        RolePermission rp = new RolePermission();
        rp.setRoleId(id);
        rp.setPermissionCode(permCode);
        rolePermissionRepository.save(rp);
      }
    }

    return ApiResponse.success(
        new RoleResponse(
            role.getId(),
            role.getName(),
            role.getDescription(),
            rolePermissionRepository.findPermissionCodesByRoleId(id),
            Boolean.TRUE.equals(role.getPreset())));
  }

  @Transactional
  public ApiResponse<?> deleteRole(String id) {
    Role role = roleRepository.findById(id).orElseThrow(() -> new NotFoundException("角色不存在"));
    if (Boolean.TRUE.equals(role.getPreset())) {
      throw new InvalidOperationException("预设角色不可删除");
    }
    rolePermissionRepository.deleteByRoleId(id);
    roleRepository.delete(role);
    return ApiResponse.success();
  }

  /** 供权限同步使用：补齐 admin 角色缺失的授权。 */
  @Transactional
  public List<String> grantMissingToAdmin(List<String> allCodes) {
    List<String> existing = rolePermissionRepository.findPermissionCodesByRoleId("admin");
    List<String> granted = new ArrayList<>();
    for (String code : allCodes) {
      if (!existing.contains(code)) {
        RolePermission rp = new RolePermission();
        rp.setRoleId("admin");
        rp.setPermissionCode(code);
        rolePermissionRepository.save(rp);
        granted.add(code);
      }
    }
    return granted;
  }
}

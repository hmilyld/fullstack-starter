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
import com.hmilyld.fullstack.entity.User;
import com.hmilyld.fullstack.repository.RolePermissionRepository;
import com.hmilyld.fullstack.repository.RoleRepository;
import com.hmilyld.fullstack.repository.UserRepository;
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
  @Autowired private UserRepository userRepository;
  @Autowired private SystemConfigService systemConfigService;

  /** 默认角色的兜底值：系统设置未配置或指向不可用角色时使用。 */
  private static final String DEFAULT_ROLE_ID = "user";

  public ApiResponse<PageResult<RoleResponse>> getRoles(String search, int page, int pageSize) {
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
  public ApiResponse<RoleResponse> createRole(RoleCreateRequest req) {
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
  public ApiResponse<RoleResponse> updateRole(String id, RoleUpdateRequest req) {
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
  public ApiResponse<Void> deleteRole(String id) {
    Role role = roleRepository.findById(id).orElseThrow(() -> new NotFoundException("角色不存在"));
    if (Boolean.TRUE.equals(role.getPreset())) {
      throw new InvalidOperationException("预设角色不可删除");
    }
    // 该角色下的用户先转交到默认角色，避免 users.role_id 指向已删除的角色。
    // 前端删除确认框的文案就是按这个语义写的：「已分配该角色的用户将失去对应权限」。
    String fallbackRoleId = fallbackRoleId(id);
    for (User user : userRepository.findByRoleId(id)) {
      user.setRoleId(fallbackRoleId);
      userRepository.save(user);
    }
    rolePermissionRepository.deleteByRoleId(id);
    roleRepository.delete(role);
    return ApiResponse.success();
  }

  /** 删除角色时把其下用户转交给哪个角色。 */
  private String fallbackRoleId(String deletingRoleId) {
    String configured = systemConfigService.getConfig().getDefaultRoleId();
    for (String candidate : new String[] {configured, DEFAULT_ROLE_ID}) {
      if (candidate == null || candidate.isBlank() || candidate.equals(deletingRoleId)) {
        continue;
      }
      if (roleRepository.existsById(candidate)) {
        return candidate;
      }
    }
    throw new InvalidOperationException("找不到可用的默认角色，请先在系统设置中配置默认角色");
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

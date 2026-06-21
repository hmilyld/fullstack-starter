package com.hmilyld.fullstack.service;

import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.common.PageResult;
import com.hmilyld.fullstack.dto.RoleCreateRequest;
import com.hmilyld.fullstack.dto.RoleUpdateRequest;
import com.hmilyld.fullstack.entity.Role;
import com.hmilyld.fullstack.entity.RolePermission;
import com.hmilyld.fullstack.repository.RolePermissionRepository;
import com.hmilyld.fullstack.repository.RoleRepository;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RoleService {

@Autowired private RoleRepository roleRepository;
@Autowired private RolePermissionRepository rolePermissionRepository;

public ApiResponse<?> getRoles(String search, int page, int pageSize) {
	// 防御性校验分页参数
	page = Math.max(1, page);
	pageSize = Math.min(100, Math.max(1, pageSize));

	Page<Role> rolePage =
		roleRepository.search(
			search, PageRequest.of(page - 1, pageSize, Sort.by("id").ascending()));

	List<Map<String, Object>> list =
		rolePage.getContent().stream()
			.map(
				role -> {
				Map<String, Object> map = new HashMap<>();
				map.put("id", role.getId());
				map.put("name", role.getName());
				map.put("description", role.getDescription());
				map.put("isPreset", role.getPreset());
				List<String> perms =
					rolePermissionRepository.findPermissionCodesByRoleId(role.getId());
				map.put("permissions", perms);
				return map;
				})
			.toList();

	PageResult<Map<String, Object>> result =
		new PageResult<>(list, rolePage.getTotalElements(), page, pageSize);
	return ApiResponse.success(result);
}

@Transactional
public ApiResponse<?> createRole(RoleCreateRequest req) {
	String roleId = UUID.randomUUID().toString().substring(0, 8);

	Role role = new Role();
	role.setId(roleId);
	role.setName(req.getName());
	role.setDescription(req.getDescription() != null ? req.getDescription() : "");
	role.setPreset(false);
	roleRepository.save(role);

	for (String permCode : req.getPermissions()) {
	RolePermission rp = new RolePermission();
	rp.setRoleId(roleId);
	rp.setPermissionCode(permCode);
	rolePermissionRepository.save(rp);
	}

	Map<String, Object> out = new HashMap<>();
	out.put("id", role.getId());
	out.put("name", role.getName());
	out.put("description", role.getDescription());
	out.put("permissions", req.getPermissions());
	out.put("isPreset", false);
	return ApiResponse.success(out);
}

@Transactional
public ApiResponse<?> updateRole(String id, RoleUpdateRequest req) {
	return roleRepository
		.findById(id)
		.map(
			role -> {
			if (req.getName() != null) role.setName(req.getName());
			if (req.getDescription() != null) role.setDescription(req.getDescription());
			roleRepository.save(role);

			if (req.getPermissions() != null) {
				rolePermissionRepository.findByRoleId(id).forEach(rolePermissionRepository::delete);
				for (String permCode : req.getPermissions()) {
				RolePermission rp = new RolePermission();
				rp.setRoleId(id);
				rp.setPermissionCode(permCode);
				rolePermissionRepository.save(rp);
				}
			}

			List<String> currentPerms = rolePermissionRepository.findPermissionCodesByRoleId(id);
			Map<String, Object> out = new HashMap<>();
			out.put("id", role.getId());
			out.put("name", role.getName());
			out.put("description", role.getDescription());
			out.put("permissions", currentPerms);
			out.put("isPreset", role.getPreset());
			return ApiResponse.success(out);
			})
		.orElse(ApiResponse.error("角色不存在"));
}

@Transactional
public ApiResponse<?> deleteRole(String id) {
	return roleRepository
		.findById(id)
		.map(
			role -> {
			if (Boolean.TRUE.equals(role.getPreset())) {
				return ApiResponse.error("预设角色不可删除");
			}
			roleRepository.delete(role);
			return ApiResponse.success();
			})
		.orElse(ApiResponse.error("角色不存在"));
}
}

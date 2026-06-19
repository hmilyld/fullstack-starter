package com.hmilyld.fullstack.service;

import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.dto.PermissionCreateRequest;
import com.hmilyld.fullstack.dto.PermissionUpdateRequest;
import com.hmilyld.fullstack.entity.Permission;
import com.hmilyld.fullstack.repository.PermissionRepository;
import com.hmilyld.fullstack.repository.RolePermissionRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PermissionService {

@Autowired private PermissionRepository permissionRepository;
@Autowired private RolePermissionRepository rolePermissionRepository;

public ApiResponse<?> getPermissions(String type, String parent) {
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

	List<Map<String, Object>> list =
		permissions.stream()
			.map(
				p -> {
				Map<String, Object> map = new HashMap<>();
				map.put("code", p.getCode());
				map.put("name", p.getName());
				map.put("type", p.getType());
				map.put("parent", p.getParent());
				return map;
				})
			.toList();

	return ApiResponse.success(list);
}

@Transactional
public ApiResponse<?> createPermission(PermissionCreateRequest req) {
	if (permissionRepository.findById(req.getCode()).isPresent()) {
	return ApiResponse.error("权限编码已存在");
	}

	Permission perm = new Permission();
	perm.setCode(req.getCode());
	perm.setName(req.getName());
	perm.setType(req.getType());
	perm.setParent(req.getParent());
	permissionRepository.save(perm);

	Map<String, Object> out = new HashMap<>();
	out.put("code", perm.getCode());
	out.put("name", perm.getName());
	out.put("type", perm.getType());
	out.put("parent", perm.getParent());
	return ApiResponse.success(out);
}

@Transactional
public ApiResponse<?> updatePermission(String code, PermissionUpdateRequest req) {
	return permissionRepository
		.findById(code)
		.map(
			perm -> {
			if (req.getName() != null) perm.setName(req.getName());
			if (req.getParent() != null) perm.setParent(req.getParent());
			permissionRepository.save(perm);

			Map<String, Object> out = new HashMap<>();
			out.put("code", perm.getCode());
			out.put("name", perm.getName());
			out.put("type", perm.getType());
			out.put("parent", perm.getParent());
			return ApiResponse.success(out);
			})
		.orElse(ApiResponse.error("权限不存在"));
}

@Transactional
public ApiResponse<?> deletePermission(String code) {
	return permissionRepository
		.findById(code)
		.map(
			perm -> {
			if ("menu".equals(perm.getType())) {
				List<Permission> children = permissionRepository.findByParent(code);
				permissionRepository.deleteAll(children);
			}
			permissionRepository.delete(perm);
			return ApiResponse.success();
			})
		.orElse(ApiResponse.error("权限不存在"));
}
}

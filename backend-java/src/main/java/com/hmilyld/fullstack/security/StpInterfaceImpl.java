package com.hmilyld.fullstack.security;

import cn.dev33.satoken.stp.StpInterface;
import com.hmilyld.fullstack.entity.User;
import com.hmilyld.fullstack.repository.RolePermissionRepository;
import com.hmilyld.fullstack.repository.UserRepository;
import java.util.Collections;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class StpInterfaceImpl implements StpInterface {

@Autowired private UserRepository userRepository;
@Autowired private RolePermissionRepository rolePermissionRepository;

@Override
public List<String> getPermissionList(Object loginId, String loginType) {
	Long userId = Long.parseLong(loginId.toString());
	User user = userRepository.findById(userId).orElse(null);
	if (user == null) return Collections.emptyList();

	if ("admin".equals(user.getRoleId())) {
	return rolePermissionRepository.findAllPermissionCodes();
	}

	return rolePermissionRepository.findPermissionCodesByRoleId(user.getRoleId());
}

@Override
public List<String> getRoleList(Object loginId, String loginType) {
	Long userId = Long.parseLong(loginId.toString());
	User user = userRepository.findById(userId).orElse(null);
	if (user == null) return Collections.emptyList();
	return List.of(user.getRoleId());
}
}

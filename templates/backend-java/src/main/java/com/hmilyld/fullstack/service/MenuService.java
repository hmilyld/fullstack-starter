package com.hmilyld.fullstack.service;

import cn.dev33.satoken.stp.StpUtil;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.config.MenuCatalog;
import com.hmilyld.fullstack.dto.MenuItemCreateRequest;
import com.hmilyld.fullstack.dto.MenuItemUpdateRequest;
import com.hmilyld.fullstack.dto.MenuLayoutRequest;
import com.hmilyld.fullstack.entity.AppState;
import com.hmilyld.fullstack.entity.MenuGroup;
import com.hmilyld.fullstack.entity.MenuItem;
import com.hmilyld.fullstack.entity.Permission;
import com.hmilyld.fullstack.entity.RolePermission;
import com.hmilyld.fullstack.entity.User;
import com.hmilyld.fullstack.repository.MenuGroupRepository;
import com.hmilyld.fullstack.repository.MenuItemRepository;
import com.hmilyld.fullstack.repository.PermissionRepository;
import com.hmilyld.fullstack.repository.RolePermissionRepository;
import com.hmilyld.fullstack.repository.UserRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MenuService {

@Autowired private MenuGroupRepository menuGroupRepository;
@Autowired private MenuItemRepository menuItemRepository;
@Autowired private PermissionRepository permissionRepository;
@Autowired private RolePermissionRepository rolePermissionRepository;
@Autowired private UserRepository userRepository;
@Autowired private AppStateService appStateService;

@Transactional
public Map<String, Object> syncCatalog() {
	List<String> addedGroups = new ArrayList<>();
	List<String> addedItems = new ArrayList<>();

	for (MenuCatalog.MenuGroupItem item : MenuCatalog.GROUPS) {
	if (menuGroupRepository.findById(item.id()).isEmpty()) {
		MenuGroup group = new MenuGroup();
		group.setId(item.id());
		group.setName(item.name());
		group.setSortOrder(item.sortOrder());
		group.setSystem(item.system());
		menuGroupRepository.save(group);
		addedGroups.add(item.id());
	}
	}

	for (MenuCatalog.MenuItem source : MenuCatalog.ITEMS) {
	if (menuItemRepository.findById(source.permissionCode()).isEmpty()) {
		MenuItem item = new MenuItem();
		item.setPermissionCode(source.permissionCode());
		item.setGroupId(source.groupId());
		item.setRoute(source.route());
		item.setIcon(source.icon());
		item.setSortOrder(source.sortOrder());
		item.setSystem(source.system());
		menuItemRepository.save(item);
		addedItems.add(source.permissionCode());
	}
	}

	Map<String, Object> result = new HashMap<>();
	result.put("groups", addedGroups);
	result.put("items", addedItems);
	return result;
}

public ApiResponse<?> getConfig() {
	Map<String, List<Map<String, Object>>> itemsByGroup = new LinkedHashMap<>();
	for (MenuItem item : menuItemRepository.findAllByOrderBySortOrderAscPermissionCodeAsc()) {
	Permission permission = permissionRepository.findById(item.getPermissionCode()).orElse(null);
	if (permission == null) continue;
	Map<String, Object> value = new HashMap<>();
	value.put("permissionCode", item.getPermissionCode());
	value.put("name", permission.getName());
	value.put("groupId", item.getGroupId());
	value.put("route", item.getRoute());
	value.put("icon", item.getIcon());
	value.put("sortOrder", item.getSortOrder());
	value.put("isSystem", item.getSystem());
	itemsByGroup.computeIfAbsent(item.getGroupId(), key -> new ArrayList<>()).add(value);
	}

	List<Map<String, Object>> groups = new ArrayList<>();
	for (MenuGroup group : menuGroupRepository.findAllByOrderBySortOrderAscIdAsc()) {
	Map<String, Object> value = new HashMap<>();
	value.put("id", group.getId());
	value.put("name", group.getName());
	value.put("sortOrder", group.getSortOrder());
	value.put("isSystem", group.getSystem());
	value.put("items", itemsByGroup.getOrDefault(group.getId(), List.of()));
	groups.add(value);
	}

	AppState state = appStateService.getOrCreate();
	Map<String, Object> result = new HashMap<>();
	result.put("version", state.getMenuLayoutVersion());
	result.put("groups", groups);
	return ApiResponse.success(result);
}

public ApiResponse<?> getNavigation() {
	long userId = Long.parseLong(StpUtil.getLoginId().toString());
	User user = userRepository.findById(userId).orElse(null);
	if (user == null) return ApiResponse.error("用户不存在");

	List<String> permissions =
		"admin".equals(user.getRoleId())
			? rolePermissionRepository.findAllPermissionCodes()
			: rolePermissionRepository.findPermissionCodesByRoleId(user.getRoleId());
	Set<String> allowed = new HashSet<>(permissions);

	Map<String, Map<String, Object>> groups = new LinkedHashMap<>();
	for (MenuItem item : menuItemRepository.findAllByOrderBySortOrderAscPermissionCodeAsc()) {
	if (!allowed.contains(item.getPermissionCode())) continue;
	MenuGroup group = menuGroupRepository.findById(item.getGroupId()).orElse(null);
	Permission permission = permissionRepository.findById(item.getPermissionCode()).orElse(null);
	if (group == null || permission == null || !"menu".equals(permission.getType())) continue;

	Map<String, Object> groupValue =
		groups.computeIfAbsent(
			group.getId(),
			key -> {
				Map<String, Object> value = new HashMap<>();
				value.put("id", group.getId());
				value.put("name", group.getName());
				value.put("sortOrder", group.getSortOrder());
				value.put("items", new ArrayList<Map<String, Object>>());
				return value;
			});

	@SuppressWarnings("unchecked")
	List<Map<String, Object>> groupItems = (List<Map<String, Object>>) groupValue.get("items");
	Map<String, Object> itemValue = new HashMap<>();
	itemValue.put("permissionCode", item.getPermissionCode());
	itemValue.put("name", permission.getName());
	itemValue.put("route", item.getRoute());
	itemValue.put("icon", item.getIcon());
	itemValue.put("sortOrder", item.getSortOrder());
	groupItems.add(itemValue);
	}
	return ApiResponse.success(new ArrayList<>(groups.values()));
}

@Transactional
public ApiResponse<?> createGroup(String name) {
	int maxOrder =
		menuGroupRepository.findAll().stream()
			.mapToInt(item -> item.getSortOrder() == null ? 0 : item.getSortOrder())
			.max()
			.orElse(0);
	MenuGroup group = new MenuGroup();
	group.setId(UUID.randomUUID().toString().replace("-", "").substring(0, 12));
	group.setName(name);
	group.setSortOrder(maxOrder + 1);
	group.setSystem(false);
	menuGroupRepository.save(group);
	return ApiResponse.success(Map.of("id", group.getId(), "name", group.getName()));
}

@Transactional
public ApiResponse<?> updateGroup(String groupId, String name) {
	MenuGroup group = menuGroupRepository.findById(groupId).orElse(null);
	if (group == null) return ApiResponse.error("菜单分组不存在");
	group.setName(name);
	menuGroupRepository.save(group);
	return ApiResponse.success(Map.of("id", group.getId(), "name", group.getName()));
}

@Transactional
public ApiResponse<?> deleteGroup(String groupId) {
	MenuGroup group = menuGroupRepository.findById(groupId).orElse(null);
	if (group == null) return ApiResponse.error("菜单分组不存在");
	if (Boolean.TRUE.equals(group.getSystem())) return ApiResponse.error("内置分组不能删除");
	if (menuItemRepository.countByGroupId(groupId) > 0) {
	return ApiResponse.error("请先移动或删除该分组下的菜单");
	}
	menuGroupRepository.delete(group);
	return ApiResponse.success();
}

@Transactional
public ApiResponse<?> createItem(MenuItemCreateRequest request) {
	if (menuGroupRepository.findById(request.getGroupId()).isEmpty()) {
	return ApiResponse.error("菜单分组不存在");
	}
	if (permissionRepository.findById(request.getPermissionCode()).isPresent()) {
	return ApiResponse.error("权限编码已存在");
	}

	int maxOrder =
		menuItemRepository.findAll().stream()
			.filter(item -> request.getGroupId().equals(item.getGroupId()))
			.mapToInt(item -> item.getSortOrder() == null ? 0 : item.getSortOrder())
			.max()
			.orElse(0);

	Permission permission = new Permission();
	permission.setCode(request.getPermissionCode());
	permission.setName(request.getName());
	permission.setType("menu");
	permission.setParent(null);
	permissionRepository.save(permission);

	MenuItem item = new MenuItem();
	item.setPermissionCode(request.getPermissionCode());
	item.setGroupId(request.getGroupId());
	item.setRoute(request.getRoute());
	item.setIcon(
		request.getIcon() == null || request.getIcon().isBlank() ? "circle" : request.getIcon());
	item.setSortOrder(maxOrder + 1);
	item.setSystem(false);
	menuItemRepository.save(item);

	RolePermission adminGrant = new RolePermission();
	adminGrant.setRoleId("admin");
	adminGrant.setPermissionCode(permission.getCode());
	rolePermissionRepository.save(adminGrant);

	return ApiResponse.success(Map.of("permissionCode", item.getPermissionCode()));
}

@Transactional
public ApiResponse<?> updateItem(String permissionCode, MenuItemUpdateRequest request) {
	MenuItem item = menuItemRepository.findById(permissionCode).orElse(null);
	if (item == null) return ApiResponse.error("菜单不存在");

	if (request.getGroupId() != null && !request.getGroupId().equals(item.getGroupId())) {
	if (menuGroupRepository.findById(request.getGroupId()).isEmpty()) {
		return ApiResponse.error("菜单分组不存在");
	}
	int maxOrder =
		menuItemRepository.findAll().stream()
			.filter(source -> request.getGroupId().equals(source.getGroupId()))
			.mapToInt(source -> source.getSortOrder() == null ? 0 : source.getSortOrder())
			.max()
			.orElse(0);
	item.setGroupId(request.getGroupId());
	item.setSortOrder(maxOrder + 1);
	}
	if (request.getRoute() != null) item.setRoute(request.getRoute());
	if (request.getIcon() != null) {
	item.setIcon(request.getIcon().isBlank() ? "circle" : request.getIcon());
	}
	if (request.getName() != null) {
	permissionRepository
		.findById(permissionCode)
		.ifPresent(
			permission -> {
				permission.setName(request.getName());
				permissionRepository.save(permission);
			});
	}
	menuItemRepository.save(item);
	return ApiResponse.success();
}

@Transactional
public ApiResponse<?> deleteItem(String permissionCode) {
	MenuItem item = menuItemRepository.findById(permissionCode).orElse(null);
	if (item == null) return ApiResponse.error("菜单不存在");
	if (Boolean.TRUE.equals(item.getSystem())) return ApiResponse.error("内置菜单不能删除");
	rolePermissionRepository.deleteByPermissionCode(permissionCode);
	permissionRepository.deleteById(permissionCode);
	menuItemRepository.delete(item);
	return ApiResponse.success();
}

@Transactional
public ApiResponse<?> saveLayout(MenuLayoutRequest request) {
	AppState state = appStateService.getOrCreate();
	if (!state.getMenuLayoutVersion().equals(request.getVersion())) {
	return ApiResponse.error("菜单顺序已被其他管理员修改，请刷新后重试");
	}

	Map<String, MenuItem> items =
		menuItemRepository.findAll().stream()
			.collect(java.util.stream.Collectors.toMap(MenuItem::getPermissionCode, item -> item));
	Set<String> seen = new HashSet<>();
	Map<String, MenuGroup> groupUpdates = new LinkedHashMap<>();
	Map<String, Integer> groupOrders = new LinkedHashMap<>();
	Map<String, MenuItem> itemUpdates = new LinkedHashMap<>();
	Map<String, String> itemGroups = new LinkedHashMap<>();
	Map<String, Integer> itemOrders = new LinkedHashMap<>();
	for (MenuLayoutRequest.Group groupRequest : request.getGroups()) {
	MenuGroup group = menuGroupRepository.findById(groupRequest.getId()).orElse(null);
	if (group == null) return ApiResponse.error("菜单分组不存在");
	groupUpdates.put(group.getId(), group);
	groupOrders.put(group.getId(), groupRequest.getSortOrder());
	for (MenuLayoutRequest.Item itemRequest : groupRequest.getItems()) {
	MenuItem item = items.get(itemRequest.getPermissionCode());
	if (item == null || !seen.add(itemRequest.getPermissionCode())) {
		return ApiResponse.error("菜单布局包含重复或无效菜单");
	}
	itemUpdates.put(item.getPermissionCode(), item);
	itemGroups.put(item.getPermissionCode(), group.getId());
	itemOrders.put(item.getPermissionCode(), itemRequest.getSortOrder());
	}
	}
	if (!seen.equals(items.keySet())) return ApiResponse.error("菜单布局必须包含全部菜单");
	groupUpdates.forEach(
		(id, group) -> {
		group.setSortOrder(groupOrders.get(id));
		menuGroupRepository.save(group);
		});
	itemUpdates.forEach(
		(code, item) -> {
		item.setGroupId(itemGroups.get(code));
		item.setSortOrder(itemOrders.get(code));
		menuItemRepository.save(item);
		});
	state.setMenuLayoutVersion(state.getMenuLayoutVersion() + 1);
	return ApiResponse.success(Map.of("version", state.getMenuLayoutVersion()));
}
}

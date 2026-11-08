package com.hmilyld.fullstack.service;

import cn.dev33.satoken.stp.StpUtil;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.common.ConflictException;
import com.hmilyld.fullstack.common.InvalidOperationException;
import com.hmilyld.fullstack.common.NotFoundException;
import com.hmilyld.fullstack.config.MenuCatalog;
import com.hmilyld.fullstack.dto.MenuConfigResponse;
import com.hmilyld.fullstack.dto.MenuGroupResult;
import com.hmilyld.fullstack.dto.MenuItemCreateRequest;
import com.hmilyld.fullstack.dto.MenuItemResult;
import com.hmilyld.fullstack.dto.MenuItemUpdateRequest;
import com.hmilyld.fullstack.dto.MenuLayoutRequest;
import com.hmilyld.fullstack.dto.MenuLayoutResult;
import com.hmilyld.fullstack.dto.NavigationGroupResponse;
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
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 菜单领域。
 *
 * <p>菜单展示（{@code menu_groups} / {@code menu_items}）与权限授权（{@code permissions}）分离： {@code
 * permissions} 是授权唯一来源，菜单只负责分组、路由、图标、顺序与侧边栏可见性。
 */
@Service
public class MenuService {

  private static final String MENU_TYPE = "menu";
  private static final String OPERATION_TYPE = "operation";
  private static final String ADMIN_ROLE_ID = "admin";

  @Autowired private MenuGroupRepository menuGroupRepository;
  @Autowired private MenuItemRepository menuItemRepository;
  @Autowired private PermissionRepository permissionRepository;
  @Autowired private RolePermissionRepository rolePermissionRepository;
  @Autowired private UserRepository userRepository;
  @Autowired private AppStateService appStateService;

  /** 补齐内置分组与菜单，不覆盖已有的顺序调整。 */
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
        item.setHidden(source.hidden());
        menuItemRepository.save(item);
        addedItems.add(source.permissionCode());
      }
    }

    Map<String, Object> result = new LinkedHashMap<>();
    result.put("groups", addedGroups);
    result.put("items", addedItems);
    return result;
  }

  public ApiResponse<MenuConfigResponse> getConfig() {
    Map<String, List<MenuConfigResponse.MenuOperationResponse>> operationsByParent =
        new LinkedHashMap<>();
    List<Permission> operationPermissions = permissionRepository.findByType(OPERATION_TYPE);
    operationPermissions.sort(java.util.Comparator.comparing(Permission::getCode));
    for (Permission permission : operationPermissions) {
      if (permission.getParent() == null) continue;
      operationsByParent
          .computeIfAbsent(permission.getParent(), key -> new ArrayList<>())
          .add(
              new MenuConfigResponse.MenuOperationResponse(
                  permission.getCode(), permission.getName()));
    }

    Map<String, List<MenuConfigResponse.MenuItemResponse>> itemsByGroup = new LinkedHashMap<>();
    for (MenuItem item : menuItemRepository.findAllByOrderBySortOrderAscPermissionCodeAsc()) {
      Permission permission = permissionRepository.findById(item.getPermissionCode()).orElse(null);
      if (permission == null) continue;
      itemsByGroup
          .computeIfAbsent(item.getGroupId(), key -> new ArrayList<>())
          .add(
              new MenuConfigResponse.MenuItemResponse(
                  item.getPermissionCode(),
                  permission.getName(),
                  item.getGroupId(),
                  item.getRoute(),
                  item.getIcon(),
                  item.getSortOrder() == null ? 0 : item.getSortOrder(),
                  Boolean.TRUE.equals(item.getSystem()),
                  Boolean.TRUE.equals(item.getHidden()),
                  operationsByParent.getOrDefault(item.getPermissionCode(), List.of())));
    }

    List<MenuConfigResponse.MenuGroupResponse> groups = new ArrayList<>();
    for (MenuGroup group : menuGroupRepository.findAllByOrderBySortOrderAscIdAsc()) {
      groups.add(
          new MenuConfigResponse.MenuGroupResponse(
              group.getId(),
              group.getName(),
              group.getSortOrder() == null ? 0 : group.getSortOrder(),
              Boolean.TRUE.equals(group.getSystem()),
              itemsByGroup.getOrDefault(group.getId(), List.of())));
    }

    AppState state = appStateService.getOrCreate();
    return ApiResponse.success(new MenuConfigResponse(state.getMenuLayoutVersion(), groups));
  }

  public ApiResponse<List<NavigationGroupResponse>> getNavigation() {
    long userId = Long.parseLong(StpUtil.getLoginId().toString());
    User user = userRepository.findById(userId).orElseThrow(() -> new NotFoundException("用户不存在"));

    Set<String> allowed =
        new HashSet<>(
            ADMIN_ROLE_ID.equals(user.getRoleId())
                ? rolePermissionRepository.findAllPermissionCodes()
                : rolePermissionRepository.findPermissionCodesByRoleId(user.getRoleId()));

    Map<String, List<NavigationGroupResponse.NavigationItemResponse>> itemsByGroup =
        new LinkedHashMap<>();
    Map<String, NavigationGroupResponse> groups = new LinkedHashMap<>();

    for (MenuItem item : menuItemRepository.findAllByOrderBySortOrderAscPermissionCodeAsc()) {
      if (Boolean.TRUE.equals(item.getHidden())) continue;
      if (!allowed.contains(item.getPermissionCode())) continue;
      MenuGroup group = menuGroupRepository.findById(item.getGroupId()).orElse(null);
      Permission permission = permissionRepository.findById(item.getPermissionCode()).orElse(null);
      if (group == null || permission == null || !MENU_TYPE.equals(permission.getType())) continue;

      groups.computeIfAbsent(
          group.getId(),
          key ->
              new NavigationGroupResponse(
                  group.getId(),
                  group.getName(),
                  group.getSortOrder() == null ? 0 : group.getSortOrder(),
                  new ArrayList<>()));
      itemsByGroup
          .computeIfAbsent(group.getId(), key -> new ArrayList<>())
          .add(
              new NavigationGroupResponse.NavigationItemResponse(
                  item.getPermissionCode(),
                  permission.getName(),
                  item.getRoute(),
                  item.getIcon(),
                  item.getSortOrder() == null ? 0 : item.getSortOrder()));
    }

    List<NavigationGroupResponse> result =
        groups.values().stream()
            .map(
                group ->
                    new NavigationGroupResponse(
                        group.id(),
                        group.name(),
                        group.sortOrder(),
                        itemsByGroup.getOrDefault(group.id(), List.of())))
            .toList();
    return ApiResponse.success(result);
  }

  @Transactional
  public ApiResponse<MenuGroupResult> createGroup(String name) {
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
    return ApiResponse.success(
        new MenuGroupResult(group.getId(), group.getName(), group.getSortOrder()));
  }

  @Transactional
  public ApiResponse<MenuGroupResult> updateGroup(String groupId, String name) {
    MenuGroup group =
        menuGroupRepository.findById(groupId).orElseThrow(() -> new NotFoundException("菜单分组不存在"));
    group.setName(name);
    menuGroupRepository.save(group);
    return ApiResponse.success(new MenuGroupResult(group.getId(), group.getName(), null));
  }

  @Transactional
  public ApiResponse<Void> deleteGroup(String groupId) {
    MenuGroup group =
        menuGroupRepository.findById(groupId).orElseThrow(() -> new NotFoundException("菜单分组不存在"));
    if (Boolean.TRUE.equals(group.getSystem())) {
      throw new InvalidOperationException("内置分组不能删除");
    }
    if (menuItemRepository.countByGroupId(groupId) > 0) {
      throw new InvalidOperationException("请先移动或删除该分组下的菜单");
    }
    menuGroupRepository.delete(group);
    return ApiResponse.success();
  }

  @Transactional
  public ApiResponse<MenuItemResult> createItem(MenuItemCreateRequest request) {
    if (menuGroupRepository.findById(request.getGroupId()).isEmpty()) {
      throw new NotFoundException("菜单分组不存在");
    }
    if (permissionRepository.findById(request.getPermissionCode()).isPresent()) {
      throw new ConflictException("权限编码已存在");
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
    permission.setType(MENU_TYPE);
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
    item.setHidden(Boolean.TRUE.equals(request.getHidden()));
    menuItemRepository.save(item);

    RolePermission adminGrant = new RolePermission();
    adminGrant.setRoleId(ADMIN_ROLE_ID);
    adminGrant.setPermissionCode(permission.getCode());
    rolePermissionRepository.save(adminGrant);

    return ApiResponse.success(new MenuItemResult(item.getPermissionCode()));
  }

  @Transactional
  public ApiResponse<Void> updateItem(String permissionCode, MenuItemUpdateRequest request) {
    MenuItem item =
        menuItemRepository
            .findById(permissionCode)
            .orElseThrow(() -> new NotFoundException("菜单不存在"));

    if (request.getGroupId() != null && !request.getGroupId().equals(item.getGroupId())) {
      if (menuGroupRepository.findById(request.getGroupId()).isEmpty()) {
        throw new NotFoundException("菜单分组不存在");
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
    if (request.getHidden() != null) item.setHidden(request.getHidden());
    if (request.getName() != null) {
      Permission permission = permissionRepository.findById(permissionCode).orElse(null);
      if (permission != null) {
        permission.setName(request.getName());
        permissionRepository.save(permission);
      }
    }
    menuItemRepository.save(item);
    return ApiResponse.success();
  }

  @Transactional
  public ApiResponse<Void> deleteItem(String permissionCode) {
    MenuItem item =
        menuItemRepository
            .findById(permissionCode)
            .orElseThrow(() -> new NotFoundException("菜单不存在"));
    if (Boolean.TRUE.equals(item.getSystem())) {
      throw new InvalidOperationException("内置菜单不能删除");
    }

    List<Permission> children = permissionRepository.findByParent(permissionCode);
    List<String> childCodes = children.stream().map(Permission::getCode).toList();
    if (!childCodes.isEmpty()) {
      rolePermissionRepository.deleteByPermissionCodeIn(childCodes);
      permissionRepository.deleteAll(children);
    }
    rolePermissionRepository.deleteByPermissionCode(permissionCode);
    permissionRepository.deleteById(permissionCode);
    menuItemRepository.delete(item);
    return ApiResponse.success();
  }

  @Transactional
  public ApiResponse<MenuLayoutResult> saveLayout(MenuLayoutRequest request) {
    AppState state = appStateService.getOrCreate();
    if (!state.getMenuLayoutVersion().equals(request.getVersion())) {
      throw new ConflictException("菜单顺序已被其他管理员修改，请刷新后重试");
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
      MenuGroup group =
          menuGroupRepository
              .findById(groupRequest.getId())
              .orElseThrow(() -> new NotFoundException("菜单分组不存在"));
      groupUpdates.put(group.getId(), group);
      groupOrders.put(group.getId(), groupRequest.getSortOrder());
      for (MenuLayoutRequest.Item itemRequest : groupRequest.getItems()) {
        MenuItem item = items.get(itemRequest.getPermissionCode());
        if (item == null || !seen.add(itemRequest.getPermissionCode())) {
          throw new InvalidOperationException("菜单布局包含重复或无效菜单");
        }
        itemUpdates.put(item.getPermissionCode(), item);
        itemGroups.put(item.getPermissionCode(), group.getId());
        itemOrders.put(item.getPermissionCode(), itemRequest.getSortOrder());
      }
    }
    if (!seen.equals(items.keySet())) {
      throw new InvalidOperationException("菜单布局必须包含全部菜单");
    }

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
    return ApiResponse.success(new MenuLayoutResult(state.getMenuLayoutVersion()));
  }
}

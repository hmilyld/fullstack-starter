package com.hmilyld.fullstack.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.dto.MenuGroupCreateRequest;
import com.hmilyld.fullstack.dto.MenuGroupUpdateRequest;
import com.hmilyld.fullstack.dto.MenuItemCreateRequest;
import com.hmilyld.fullstack.dto.MenuItemUpdateRequest;
import com.hmilyld.fullstack.dto.MenuLayoutRequest;
import com.hmilyld.fullstack.service.MenuService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/menus")
public class MenuController {

@Autowired private MenuService menuService;

@GetMapping("/navigation")
public ApiResponse<?> navigation() {
	return menuService.getNavigation();
}

@GetMapping("")
@SaCheckPermission("menus")
public ApiResponse<?> getConfig() {
	return menuService.getConfig();
}

@PostMapping("/groups")
@SaCheckPermission("menus.create")
public ApiResponse<?> createGroup(@RequestBody @Valid MenuGroupCreateRequest request) {
	return menuService.createGroup(request.getName());
}

@PutMapping("/groups/{groupId}")
@SaCheckPermission("menus.edit")
public ApiResponse<?> updateGroup(
	@PathVariable String groupId, @RequestBody @Valid MenuGroupUpdateRequest request) {
	return menuService.updateGroup(groupId, request.getName());
}

@DeleteMapping("/groups/{groupId}")
@SaCheckPermission("menus.delete")
public ApiResponse<?> deleteGroup(@PathVariable String groupId) {
	return menuService.deleteGroup(groupId);
}

@PostMapping("/items")
@SaCheckPermission("menus.create")
public ApiResponse<?> createItem(@RequestBody @Valid MenuItemCreateRequest request) {
	return menuService.createItem(request);
}

@PutMapping("/items/{permissionCode}")
@SaCheckPermission("menus.edit")
public ApiResponse<?> updateItem(
	@PathVariable String permissionCode, @RequestBody @Valid MenuItemUpdateRequest request) {
	return menuService.updateItem(permissionCode, request);
}

@DeleteMapping("/items/{permissionCode}")
@SaCheckPermission("menus.delete")
public ApiResponse<?> deleteItem(@PathVariable String permissionCode) {
	return menuService.deleteItem(permissionCode);
}

@PutMapping("/layout")
@SaCheckPermission("menus.reorder")
public ApiResponse<?> saveLayout(@RequestBody @Valid MenuLayoutRequest request) {
	return menuService.saveLayout(request);
}
}

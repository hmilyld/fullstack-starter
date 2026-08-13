package com.hmilyld.fullstack.config;

import java.util.List;

public final class PermissionCatalog {

	private PermissionCatalog() {}

	public record PermissionItem(String code, String name, String type, String parent) {}

	public static final List<PermissionItem> MENU_PERMISSIONS =
		List.of(
			new PermissionItem("dashboard", "仪表盘", "menu", null),
			new PermissionItem("users", "用户管理", "menu", null),
			new PermissionItem("roles", "角色管理", "menu", null),
			new PermissionItem("permissions", "权限管理", "menu", null),
			new PermissionItem("settings", "系统设置", "menu", null),
			new PermissionItem("ai_models", "AI模型配置", "menu", null));

	public static final List<PermissionItem> OPERATION_PERMISSIONS =
		List.of(
			new PermissionItem("users.create", "新增用户", "operation", "users"),
			new PermissionItem("users.edit", "编辑用户", "operation", "users"),
			new PermissionItem("users.delete", "删除用户", "operation", "users"),
			new PermissionItem("users.assign_role", "角色维护", "operation", "users"),
			new PermissionItem("roles.create", "新增角色", "operation", "roles"),
			new PermissionItem("roles.edit", "编辑角色", "operation", "roles"),
			new PermissionItem("roles.delete", "删除角色", "operation", "roles"),
			new PermissionItem("permissions.create", "新增权限", "operation", "permissions"),
			new PermissionItem("permissions.edit", "编辑权限", "operation", "permissions"),
			new PermissionItem("permissions.delete", "删除权限", "operation", "permissions"),
			new PermissionItem("settings.edit", "编辑系统设置", "operation", "settings"),
			new PermissionItem("ai_models.create", "新增AI模型", "operation", "ai_models"),
			new PermissionItem("ai_models.edit", "编辑AI模型", "operation", "ai_models"),
			new PermissionItem("ai_models.delete", "删除AI模型", "operation", "ai_models"),
			new PermissionItem("ai_models.presets.create", "新增预设模型", "operation", "ai_models"),
			new PermissionItem("ai_models.presets.edit", "编辑预设模型", "operation", "ai_models"),
			new PermissionItem("ai_models.presets.delete", "删除预设模型", "operation", "ai_models"));

	public static final List<PermissionItem> ALL_PERMISSIONS = new java.util.ArrayList<>(MENU_PERMISSIONS);
	static {
		ALL_PERMISSIONS.addAll(OPERATION_PERMISSIONS);
	}
}

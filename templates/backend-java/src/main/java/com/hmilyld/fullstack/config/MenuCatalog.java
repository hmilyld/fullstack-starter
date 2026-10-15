package com.hmilyld.fullstack.config;

import java.util.List;

public final class MenuCatalog {

private MenuCatalog() {}

public record MenuGroupItem(String id, String name, Integer sortOrder, Boolean system) {}

public record MenuItem(
	String permissionCode,
	String groupId,
	String route,
	String icon,
	Integer sortOrder,
	Boolean system) {}

public static final List<MenuGroupItem> GROUPS =
	List.of(
		new MenuGroupItem("navigation", "导航", 1, true),
		new MenuGroupItem("management", "管理", 2, true));

public static final List<MenuItem> ITEMS =
	List.of(
		new MenuItem("dashboard", "navigation", "/dashboard", "layout-dashboard", 1, true),
		new MenuItem("users", "management", "/settings/user", "users", 1, true),
		new MenuItem("roles", "management", "/settings/role", "shield-check", 2, true),
		new MenuItem("permissions", "management", "/settings/permission", "key-round", 3, true),
		new MenuItem("menus", "management", "/settings/menu", "panel-left", 4, true),
		new MenuItem("settings", "management", "/settings/system", "settings", 5, true),
		new MenuItem("ai_models", "management", "/settings/ai-model", "bot", 6, true),
		new MenuItem("audit_logs", "management", "/settings/audit-log", "file-text", 7, true),
		new MenuItem("data_management", "management", "/settings/data", "database", 8, true));
}

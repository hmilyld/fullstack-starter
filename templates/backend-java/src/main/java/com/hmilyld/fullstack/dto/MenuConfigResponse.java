package com.hmilyld.fullstack.dto;

import java.util.List;

/** 菜单配置：布局版本 + 分组。 */
public record MenuConfigResponse(int version, List<MenuGroupResponse> groups) {

  /** 菜单分组（含菜单项）。 */
  public record MenuGroupResponse(
      String id, String name, int sortOrder, boolean isSystem, List<MenuItemResponse> items) {}

  /** 菜单项（含其下操作权限）。 */
  public record MenuItemResponse(
      String permissionCode,
      String name,
      String groupId,
      String route,
      String icon,
      int sortOrder,
      boolean isSystem,
      boolean hidden,
      List<MenuOperationResponse> operations) {}

  /** 菜单下的操作权限。 */
  public record MenuOperationResponse(String code, String name) {}
}

package com.hmilyld.fullstack.dto;

import java.util.List;

/** 侧边栏导航（按权限过滤，不含 isSystem / hidden / operations）。 */
public record NavigationGroupResponse(
    String id, String name, int sortOrder, List<NavigationItemResponse> items) {

  /** 导航项。 */
  public record NavigationItemResponse(
      String permissionCode, String name, String route, String icon, int sortOrder) {}
}

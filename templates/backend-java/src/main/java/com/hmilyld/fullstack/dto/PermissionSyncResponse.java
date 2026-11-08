package com.hmilyld.fullstack.dto;

import java.util.List;

/** 权限目录同步结果。 */
public record PermissionSyncResponse(
    List<String> added, List<String> updated, List<String> granted) {}

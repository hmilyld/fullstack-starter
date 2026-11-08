package com.hmilyld.fullstack.dto;

import java.util.List;

/** 角色输出。 */
public record RoleResponse(
    String id, String name, String description, List<String> permissions, boolean isPreset) {}

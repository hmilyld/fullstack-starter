package com.hmilyld.fullstack.dto;

/** 用户输出。{@code id} 在 JSON 中是字符串，与契约一致。 */
public record UserResponse(
    String id, String username, String name, String email, String roleId, String avatar) {}

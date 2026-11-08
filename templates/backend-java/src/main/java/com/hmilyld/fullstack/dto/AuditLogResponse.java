package com.hmilyld.fullstack.dto;

/** 审计日志输出。{@code id} 与 {@code userId} 在 JSON 中是字符串。 */
public record AuditLogResponse(
    String id,
    String userId,
    String username,
    String action,
    String ip,
    String status,
    String detail,
    String createdAt) {}

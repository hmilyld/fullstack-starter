package com.hmilyld.fullstack.dto;

/** 系统配置输出。{@code smtpPassword} 恒为掩码。 */
public record SystemConfigResponse(
    String siteName,
    String siteDescription,
    String keywords,
    boolean maintenanceEnabled,
    String maintenanceMessage,
    boolean openRegistration,
    boolean manualReview,
    String defaultRoleId,
    String welcomeMessage,
    boolean smtpEnabled,
    String smtpHost,
    int smtpPort,
    String smtpUsername,
    String smtpPassword,
    String smtpFromName,
    String smtpFromEmail,
    boolean smtpUseSsl) {}

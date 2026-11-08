package com.hmilyld.fullstack.dto;

/** 公开站点配置（登录/注册页使用，无需认证）。 */
public record PublicConfigResponse(
    String siteName,
    String siteDescription,
    boolean maintenanceEnabled,
    String maintenanceMessage,
    boolean openRegistration,
    boolean manualReview) {}

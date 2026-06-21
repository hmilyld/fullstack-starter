package com.hmilyld.fullstack.dto;

import lombok.Data;

@Data
public class SystemConfigUpdateRequest {
private String siteName;
private String siteDescription;
private String keywords;
private Boolean maintenanceEnabled;
private String maintenanceMessage;
private Boolean openRegistration;
private Boolean manualReview;
private String defaultRoleId;
private String welcomeMessage;
private Boolean smtpEnabled;
private String smtpHost;
private Integer smtpPort;
private String smtpUsername;
private String smtpPassword;
private String smtpFromName;
private String smtpFromEmail;
private Boolean smtpUseSsl;
}

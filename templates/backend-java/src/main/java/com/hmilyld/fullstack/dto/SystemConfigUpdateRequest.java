package com.hmilyld.fullstack.dto;

import jakarta.validation.constraints.Pattern;
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

  @Pattern(regexp = "zh-CN|en", message = "默认语言必须是 zh-CN 或 en")
  private String defaultLocale;

  private Boolean smtpEnabled;
  private String smtpHost;
  private Integer smtpPort;
  private String smtpUsername;
  private String smtpPassword;
  private String smtpFromName;
  private String smtpFromEmail;
  private Boolean smtpUseSsl;
}

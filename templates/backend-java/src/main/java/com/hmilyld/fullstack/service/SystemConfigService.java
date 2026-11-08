package com.hmilyld.fullstack.service;

import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.common.InvalidOperationException;
import com.hmilyld.fullstack.dto.PublicConfigResponse;
import com.hmilyld.fullstack.dto.SystemConfigResponse;
import com.hmilyld.fullstack.dto.SystemConfigUpdateRequest;
import com.hmilyld.fullstack.entity.SystemConfig;
import com.hmilyld.fullstack.repository.SystemConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 系统设置领域。 */
@Service
public class SystemConfigService {

  private static final String MASK = "****";

  @Autowired private SystemConfigRepository systemConfigRepository;

  public SystemConfig getConfig() {
    return systemConfigRepository
        .findById(1L)
        .orElseGet(
            () -> {
              SystemConfig config = new SystemConfig();
              config.setId(1L);
              return systemConfigRepository.save(config);
            });
  }

  public ApiResponse<SystemConfigResponse> getConfigOut() {
    return ApiResponse.success(toResponse(getConfig()));
  }

  @Transactional
  public ApiResponse<SystemConfigResponse> updateConfig(SystemConfigUpdateRequest req) {
    SystemConfig config = getConfig();

    if (req.getSiteName() != null) config.setSiteName(req.getSiteName());
    if (req.getSiteDescription() != null) config.setSiteDescription(req.getSiteDescription());
    if (req.getKeywords() != null) config.setKeywords(req.getKeywords());
    if (req.getMaintenanceEnabled() != null)
      config.setMaintenanceEnabled(req.getMaintenanceEnabled());
    if (req.getMaintenanceMessage() != null)
      config.setMaintenanceMessage(req.getMaintenanceMessage());
    if (req.getOpenRegistration() != null) config.setOpenRegistration(req.getOpenRegistration());
    if (req.getManualReview() != null) config.setManualReview(req.getManualReview());
    if (req.getDefaultRoleId() != null) config.setDefaultRoleId(req.getDefaultRoleId());
    if (req.getWelcomeMessage() != null) config.setWelcomeMessage(req.getWelcomeMessage());
    if (req.getSmtpEnabled() != null) config.setSmtpEnabled(req.getSmtpEnabled());
    if (req.getSmtpHost() != null) config.setSmtpHost(req.getSmtpHost());
    if (req.getSmtpPort() != null) config.setSmtpPort(req.getSmtpPort());
    if (req.getSmtpUsername() != null) config.setSmtpUsername(req.getSmtpUsername());
    // 脱敏掩码（"****"）不允许写回，避免覆盖真实 SMTP 密码；空字符串表示清除密码
    if (req.getSmtpPassword() != null && !req.getSmtpPassword().contains("*")) {
      config.setSmtpPassword(req.getSmtpPassword());
    }
    if (req.getSmtpFromName() != null) config.setSmtpFromName(req.getSmtpFromName());
    if (req.getSmtpFromEmail() != null) config.setSmtpFromEmail(req.getSmtpFromEmail());
    if (req.getSmtpUseSsl() != null) config.setSmtpUseSsl(req.getSmtpUseSsl());

    systemConfigRepository.save(config);
    return ApiResponse.success(toResponse(config));
  }

  /** 校验 SMTP 配置是否可用，不满足时抛业务异常。 */
  public SystemConfig requireSmtpReady() {
    SystemConfig config = getConfig();
    if (!Boolean.TRUE.equals(config.getSmtpEnabled())) {
      throw new InvalidOperationException("邮件服务未启用，请先开启SMTP配置");
    }
    if (config.getSmtpHost() == null || config.getSmtpHost().isEmpty()) {
      throw new InvalidOperationException("SMTP服务器配置不完整");
    }
    if (config.getSmtpUsername() == null || config.getSmtpUsername().isEmpty()) {
      throw new InvalidOperationException("SMTP用户名或密码未配置");
    }
    return config;
  }

  public ApiResponse<PublicConfigResponse> publicConfig() {
    SystemConfig config = getConfig();
    return ApiResponse.success(
        new com.hmilyld.fullstack.dto.PublicConfigResponse(
            config.getSiteName(),
            config.getSiteDescription(),
            Boolean.TRUE.equals(config.getMaintenanceEnabled()),
            config.getMaintenanceMessage(),
            Boolean.TRUE.equals(config.getOpenRegistration()),
            Boolean.TRUE.equals(config.getManualReview())));
  }

  public static SystemConfigResponse toResponse(SystemConfig config) {
    return new SystemConfigResponse(
        config.getSiteName(),
        config.getSiteDescription(),
        config.getKeywords(),
        Boolean.TRUE.equals(config.getMaintenanceEnabled()),
        config.getMaintenanceMessage(),
        Boolean.TRUE.equals(config.getOpenRegistration()),
        Boolean.TRUE.equals(config.getManualReview()),
        config.getDefaultRoleId(),
        config.getWelcomeMessage(),
        Boolean.TRUE.equals(config.getSmtpEnabled()),
        config.getSmtpHost(),
        config.getSmtpPort() == null ? 0 : config.getSmtpPort(),
        config.getSmtpUsername(),
        MASK,
        config.getSmtpFromName(),
        config.getSmtpFromEmail(),
        Boolean.TRUE.equals(config.getSmtpUseSsl()));
  }
}

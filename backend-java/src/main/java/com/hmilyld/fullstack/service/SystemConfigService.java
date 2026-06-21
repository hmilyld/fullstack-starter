package com.hmilyld.fullstack.service;

import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.dto.SystemConfigUpdateRequest;
import com.hmilyld.fullstack.entity.SystemConfig;
import com.hmilyld.fullstack.repository.SystemConfigRepository;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SystemConfigService {

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

public ApiResponse<?> getConfigOut() {
	SystemConfig config = getConfig();
	return ApiResponse.success(toOutMap(config));
}

@Transactional
public ApiResponse<?> updateConfig(SystemConfigUpdateRequest req) {
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
	if (req.getSmtpPassword() != null) config.setSmtpPassword(req.getSmtpPassword());
	if (req.getSmtpFromName() != null) config.setSmtpFromName(req.getSmtpFromName());
	if (req.getSmtpFromEmail() != null) config.setSmtpFromEmail(req.getSmtpFromEmail());
	if (req.getSmtpUseSsl() != null) config.setSmtpUseSsl(req.getSmtpUseSsl());

	systemConfigRepository.save(config);
	return ApiResponse.success(toOutMap(config));
}

private Map<String, Object> toOutMap(SystemConfig config) {
	Map<String, Object> map = new HashMap<>();
	map.put("siteName", config.getSiteName());
	map.put("siteDescription", config.getSiteDescription());
	map.put("keywords", config.getKeywords());
	map.put("maintenanceEnabled", config.getMaintenanceEnabled());
	map.put("maintenanceMessage", config.getMaintenanceMessage());
	map.put("openRegistration", config.getOpenRegistration());
	map.put("manualReview", config.getManualReview());
	map.put("defaultRoleId", config.getDefaultRoleId());
	map.put("welcomeMessage", config.getWelcomeMessage());
	map.put("smtpEnabled", config.getSmtpEnabled());
	map.put("smtpHost", config.getSmtpHost());
	map.put("smtpPort", config.getSmtpPort());
	map.put("smtpUsername", config.getSmtpUsername());
	map.put("smtpPassword", maskPassword(config.getSmtpPassword()));
	map.put("smtpFromName", config.getSmtpFromName());
	map.put("smtpFromEmail", config.getSmtpFromEmail());
	map.put("smtpUseSsl", config.getSmtpUseSsl());
	return map;
}

private String maskPassword(String password) {
	if (password == null) return "****";
	if (password.length() <= 4) return "****";
	return password.substring(0, 2) + "****" + password.substring(password.length() - 2);
}
}

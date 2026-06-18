package com.hmilyld.fullstack.controller;

import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.service.SystemConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    @Autowired
    private SystemConfigService systemConfigService;

    @GetMapping("/config")
    public ApiResponse<?> getPublicConfig() {
        var config = systemConfigService.getConfig();
        Map<String, Object> data = new HashMap<>();
        data.put("siteName", config.getSiteName());
        data.put("siteDescription", config.getSiteDescription());
        data.put("maintenanceEnabled", config.getMaintenanceEnabled());
        data.put("maintenanceMessage", config.getMaintenanceMessage());
        data.put("openRegistration", config.getOpenRegistration());
        data.put("manualReview", config.getManualReview());
        return ApiResponse.success(data);
    }
}

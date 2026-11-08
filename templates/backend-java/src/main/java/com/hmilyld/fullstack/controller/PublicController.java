package com.hmilyld.fullstack.controller;

import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.dto.PublicConfigResponse;
import com.hmilyld.fullstack.service.SystemConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
public class PublicController {

  @Autowired private SystemConfigService systemConfigService;

  @GetMapping("/config")
  public ApiResponse<PublicConfigResponse> getPublicConfig() {
    return systemConfigService.publicConfig();
  }
}

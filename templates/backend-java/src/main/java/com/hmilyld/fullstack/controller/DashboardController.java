package com.hmilyld.fullstack.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.dto.DashboardStatsResponse;
import com.hmilyld.fullstack.service.DashboardService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

  @Autowired private DashboardService dashboardService;

  @GetMapping("/stats")
  @SaCheckPermission("dashboard")
  public ApiResponse<DashboardStatsResponse> getStats() {
    return dashboardService.getStats();
  }

  @GetMapping("/activity")
  @SaCheckPermission("dashboard")
  public ApiResponse<List<DashboardStatsResponse.ActivityItemResponse>> getActivity() {
    return dashboardService.getActivity();
  }
}

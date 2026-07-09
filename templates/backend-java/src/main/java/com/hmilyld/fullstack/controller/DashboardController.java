package com.hmilyld.fullstack.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

@Autowired private DashboardService dashboardService;

@GetMapping("/stats")
@SaCheckPermission("dashboard")
public ApiResponse<?> getStats() {
	return dashboardService.getStats();
}

@GetMapping("/activity")
@SaCheckPermission("dashboard")
public ApiResponse<?> getActivity() {
	return dashboardService.getActivity();
}
}

package com.hmilyld.fullstack.config;

import com.hmilyld.fullstack.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class PermissionSyncRunner implements ApplicationRunner {

	@Autowired private PermissionService permissionService;

	@Override
	public void run(ApplicationArguments args) {
		permissionService.syncPermissions();
	}
}

package com.hmilyld.fullstack.config;

import com.hmilyld.fullstack.service.MenuService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(2)
public class MenuSyncRunner implements ApplicationRunner {

@Autowired private MenuService menuService;

@Override
public void run(ApplicationArguments args) {
	menuService.syncCatalog();
}
}

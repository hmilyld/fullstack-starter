package com.hmilyld.fullstack.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.audit")
public class AuditProperties {

/** 审计排除路径（前缀匹配），如认证接口由业务显式记录 */
private List<String> excludePaths = List.of("/api/auth");

public List<String> getExcludePaths() {
	return excludePaths;
}

public void setExcludePaths(List<String> excludePaths) {
	this.excludePaths = excludePaths;
}
}

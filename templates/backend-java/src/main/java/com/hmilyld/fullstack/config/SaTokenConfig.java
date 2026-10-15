package com.hmilyld.fullstack.config;

import cn.dev33.satoken.exception.NotLoginException;
import cn.dev33.satoken.interceptor.SaInterceptor;
import cn.dev33.satoken.stp.StpUtil;
import com.hmilyld.fullstack.service.AppStateService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SaTokenConfig implements WebMvcConfigurer {

@Autowired private AppStateService appStateService;

private static final List<String> EXCLUDE_PATHS =
	List.of("/api/auth/login", "/api/auth/register", "/api/public/**");
private static final Pattern DATA_IMPORT_STATUS = Pattern.compile("^/api/data/import/[^/]+$");

@Override
public void addInterceptors(InterceptorRegistry registry) {
	registry
		.addInterceptor(
			new SaInterceptor()
				.isAnnotation(true)
				.setAuth(
					handler -> {
					ServletRequestAttributes attrs =
						(ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
					if (attrs != null) {
						HttpServletRequest request = attrs.getRequest();
						String path = request.getRequestURI();
						boolean excluded =
							EXCLUDE_PATHS.stream().anyMatch(pattern -> matchPath(path, pattern));
						if (!excluded && !DATA_IMPORT_STATUS.matcher(path).matches()) {
						StpUtil.checkLogin();
						Object authEpoch = StpUtil.getSession().get("authEpoch");
						if (!appStateService.getSessionEpoch().equals(authEpoch)) {
							StpUtil.logout();
							throw new NotLoginException(
								"登录状态已失效，请重新登录",
								StpUtil.getLoginType(),
								NotLoginException.INVALID_TOKEN);
						}
						}
					}
					}))
		.addPathPatterns("/api/**");
}

private boolean matchPath(String path, String pattern) {
	if (pattern.endsWith("/**")) {
	return path.startsWith(pattern.substring(0, pattern.length() - 3));
	}
	return path.equals(pattern);
}
}

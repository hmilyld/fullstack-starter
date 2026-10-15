package com.hmilyld.fullstack.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class DataFreezeFilter extends OncePerRequestFilter {

private static final Pattern IMPORT_STATUS_PATH = Pattern.compile("^/api/data/import/[^/]+$");

@Autowired private DataOperationState state;

@Override
protected void doFilterInternal(
	HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
	throws ServletException, IOException {
	if (state.isFrozen()
		&& !"OPTIONS".equalsIgnoreCase(request.getMethod())
		&& !IMPORT_STATUS_PATH.matcher(request.getRequestURI()).matches()) {
	response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
	response.setCharacterEncoding(StandardCharsets.UTF_8.name());
	response.setContentType(MediaType.APPLICATION_JSON_VALUE);
	response.getWriter().write("{\"code\":-1,\"message\":\"系统正在导入数据，请稍后重试\",\"data\":null}");
	return;
	}
	filterChain.doFilter(request, response);
}
}

package com.hmilyld.fullstack.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import java.io.IOException;
import java.util.*;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * 在 Sa-Token 拦截之前，将 "Authorization: Bearer xxx" 格式的请求 转换为 Sa-Token 能识别的格式（设置 satoken header）。
 * 这样前端可以统一使用 "Authorization: Bearer <token>" 格式，兼容 Python (JWT) 和 Java (Sa-Token) 后端。
 */
@Component
@Order(-100) // 确保在 Sa-Token Filter 之前执行
public class BearerTokenFilter implements Filter {

@Override
public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
	throws IOException, ServletException {

	HttpServletRequest httpRequest = (HttpServletRequest) request;
	String authHeader = httpRequest.getHeader("Authorization");

	if (authHeader != null && authHeader.startsWith("Bearer ")) {
	String token = authHeader.substring(7).trim();
	if (!token.isEmpty()) {
		// 包装请求，添加 satoken header，使 Sa-Token 能读取到 token
		HttpServletRequest wrappedRequest =
			new HttpServletRequestWrapper(httpRequest) {
			private final Map<String, String> extraHeaders =
				new TreeMap<>(String.CASE_INSENSITIVE_ORDER) {
					{
					put("satoken", token);
					}
				};

			@Override
			public String getHeader(String name) {
				String value = extraHeaders.get(name);
				if (value != null) {
				return value;
				}
				return super.getHeader(name);
			}

			@Override
			public Enumeration<String> getHeaderNames() {
				List<String> names = Collections.list(super.getHeaderNames());
				names.add("satoken");
				return Collections.enumeration(names);
			}
			};
		chain.doFilter(wrappedRequest, response);
		return;
	}
	}

	chain.doFilter(request, response);
}
}

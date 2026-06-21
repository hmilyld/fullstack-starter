package com.hmilyld.fullstack.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

@Value("${app.cors-origins:http://localhost:5173}")
private String corsOrigins;

@Bean
public CorsFilter corsFilter() {
	CorsConfiguration config = new CorsConfiguration();
	// 从配置中读取允许的源，并 trim 空格
	List<String> origins = Arrays.stream(corsOrigins.split(",")).map(String::trim).toList();
	config.setAllowedOriginPatterns(origins);
	config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
	config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
	config.setAllowCredentials(true);
	config.setMaxAge(3600L);

	UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
	source.registerCorsConfiguration("/api/**", config);
	return new CorsFilter(source);
}
}

package com.hmilyld.fullstack.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI 3 文档声明。
 *
 * <p>只声明全局信息与鉴权方案，不逐端点写 {@code @Operation}： springdoc 会从 controller 反射出方法、参数与 DTO 结构，
 * 逐条标注既冗余，又会让两栈的注释各自漂移。
 *
 * <p>Swagger UI 的 Authorize 按钮使用 {@code bearerAuth}， 与前端实际发送的 {@code Authorization: Bearer <token>}
 * 一致。
 */
@Configuration
@OpenAPIDefinition(
    info =
        @Info(
            title = "管理系统 API",
            version = "1.0.0",
            description = "与 Python (FastAPI) 版共享同一份契约，见 docs/contract/api.md"),
    security = @SecurityRequirement(name = "bearerAuth"))
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    description = "Sa-Token 会话令牌，通过 Authorization: Bearer <token> 传递")
public class OpenApiConfig {}

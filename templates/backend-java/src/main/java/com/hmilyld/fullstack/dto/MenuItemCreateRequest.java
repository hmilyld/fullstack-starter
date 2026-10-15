package com.hmilyld.fullstack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MenuItemCreateRequest {
@NotBlank
@Size(max = 100)
private String permissionCode;

@NotBlank
@Size(max = 100)
private String name;

@NotBlank private String groupId;

@NotBlank
@Size(max = 255)
@Pattern(regexp = "^/(?!/).*", message = "路由必须以单个 / 开头")
private String route;

@Size(max = 50)
private String icon = "circle";
}

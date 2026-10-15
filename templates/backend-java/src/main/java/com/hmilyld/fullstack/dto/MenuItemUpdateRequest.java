package com.hmilyld.fullstack.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MenuItemUpdateRequest {
@Size(min = 1, max = 100)
private String name;

private String groupId;

@Size(max = 255)
@Pattern(regexp = "^/(?!/).*", message = "路由必须以单个 / 开头")
private String route;

@Size(max = 50)
private String icon;
}

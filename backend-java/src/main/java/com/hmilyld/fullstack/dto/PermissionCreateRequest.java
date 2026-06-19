package com.hmilyld.fullstack.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PermissionCreateRequest {
@NotBlank(message = "权限编码不能为空")
private String code;

@NotBlank(message = "权限名称不能为空")
private String name;

@NotBlank(message = "权限类型不能为空")
private String type;

private String parent;
}

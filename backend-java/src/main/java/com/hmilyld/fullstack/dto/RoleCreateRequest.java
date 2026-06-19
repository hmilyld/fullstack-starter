package com.hmilyld.fullstack.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.Data;

@Data
public class RoleCreateRequest {
@NotBlank(message = "角色名称不能为空")
private String name;

private String description = "";

private List<String> permissions = List.of();
}

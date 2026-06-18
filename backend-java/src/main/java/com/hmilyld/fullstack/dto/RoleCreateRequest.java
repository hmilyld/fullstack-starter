package com.hmilyld.fullstack.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class RoleCreateRequest {
    @NotBlank(message = "角色名称不能为空")
    private String name;

    private String description = "";

    private List<String> permissions = List.of();
}

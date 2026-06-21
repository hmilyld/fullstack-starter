package com.hmilyld.fullstack.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiModelPresetCreateRequest {
@NotBlank(message = "分组不能为空")
private String group;

@NotBlank(message = "别名不能为空")
private String alias;

@NotBlank(message = "模型名称不能为空")
private String modelName;

@NotBlank(message = "API地址不能为空")
private String apiUrl;

private String description = "";

private Boolean isActive = true;

private Integer sortOrder = 0;
}

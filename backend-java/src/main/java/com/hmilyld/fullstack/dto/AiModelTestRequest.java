package com.hmilyld.fullstack.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiModelTestRequest {
    @NotBlank(message = "API地址不能为空")
    private String apiUrl;

    @NotBlank(message = "API Key不能为空")
    private String apiKey;

    @NotBlank(message = "模型名称不能为空")
    private String modelName;
}

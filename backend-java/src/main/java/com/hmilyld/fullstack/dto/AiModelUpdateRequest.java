package com.hmilyld.fullstack.dto;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class AiModelUpdateRequest {
@Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "别名只能包含字母、数字、下划线和连字符")
private String alias;

private String modelName;
private String apiUrl;
private String apiKey;
private String description;
private Boolean isDefault;
}

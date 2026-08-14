package com.hmilyld.fullstack.dto;

import lombok.Data;

@Data
public class AiModelTestRequest {
private Long modelId;

private String apiUrl;

private String apiKey;

private String modelName;
}

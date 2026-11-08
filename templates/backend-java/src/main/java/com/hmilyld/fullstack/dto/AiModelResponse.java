package com.hmilyld.fullstack.dto;

/** AI 模型输出（apiKey 已脱敏）。 */
public record AiModelResponse(
    String id,
    String alias,
    String modelName,
    String apiUrl,
    String apiKey,
    String description,
    boolean isDefault) {}

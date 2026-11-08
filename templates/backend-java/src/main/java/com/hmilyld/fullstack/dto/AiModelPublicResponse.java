package com.hmilyld.fullstack.dto;

/** AI 模型的公开输出（不含 apiKey）。 */
public record AiModelPublicResponse(
    String id,
    String alias,
    String modelName,
    String apiUrl,
    String description,
    boolean isDefault) {}

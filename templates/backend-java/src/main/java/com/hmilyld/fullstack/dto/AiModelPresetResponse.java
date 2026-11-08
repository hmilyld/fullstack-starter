package com.hmilyld.fullstack.dto;

/** AI 模型预设输出。 */
public record AiModelPresetResponse(
    String id,
    String group,
    String alias,
    String modelName,
    String apiUrl,
    String description,
    boolean isActive,
    int sortOrder) {}

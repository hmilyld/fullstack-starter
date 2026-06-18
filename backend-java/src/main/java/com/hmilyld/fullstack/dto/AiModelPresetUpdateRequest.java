package com.hmilyld.fullstack.dto;

import lombok.Data;

@Data
public class AiModelPresetUpdateRequest {
    private String group;
    private String alias;
    private String modelName;
    private String apiUrl;
    private String description;
    private Boolean isActive;
    private Integer sortOrder;
}

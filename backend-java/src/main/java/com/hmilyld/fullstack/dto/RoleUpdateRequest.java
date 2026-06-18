package com.hmilyld.fullstack.dto;

import lombok.Data;

import java.util.List;

@Data
public class RoleUpdateRequest {
    private String name;
    private String description;
    private List<String> permissions;
}

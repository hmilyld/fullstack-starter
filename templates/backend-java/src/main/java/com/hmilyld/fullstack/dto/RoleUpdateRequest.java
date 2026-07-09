package com.hmilyld.fullstack.dto;

import java.util.List;
import lombok.Data;

@Data
public class RoleUpdateRequest {
private String name;
private String description;
private List<String> permissions;
}

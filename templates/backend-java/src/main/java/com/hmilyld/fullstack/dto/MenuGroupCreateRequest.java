package com.hmilyld.fullstack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MenuGroupCreateRequest {
@NotBlank
@Size(max = 100)
private String name;
}

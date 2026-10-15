package com.hmilyld.fullstack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MenuGroupUpdateRequest {
@NotBlank
@Size(max = 100)
private String name;
}

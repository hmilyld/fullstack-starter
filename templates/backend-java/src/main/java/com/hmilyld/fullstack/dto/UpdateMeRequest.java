package com.hmilyld.fullstack.dto;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UpdateMeRequest {
private String name;

@Email(message = "邮箱格式不正确")
private String email;
}

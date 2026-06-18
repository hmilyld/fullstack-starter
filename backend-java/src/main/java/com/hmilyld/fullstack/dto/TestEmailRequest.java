package com.hmilyld.fullstack.dto;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class TestEmailRequest {
    @Email(message = "邮箱格式不正确")
    private String email;
}

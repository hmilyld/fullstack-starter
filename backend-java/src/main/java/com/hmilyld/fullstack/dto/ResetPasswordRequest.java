package com.hmilyld.fullstack.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @Size(min = 6, message = "密码长度不能少于6位")
    private String newPassword;
}

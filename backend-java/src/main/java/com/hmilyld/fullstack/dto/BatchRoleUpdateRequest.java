package com.hmilyld.fullstack.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BatchRoleUpdateRequest {
    @NotEmpty(message = "用户列表不能为空")
    private List<Long> userIds;

    private String roleId;
}

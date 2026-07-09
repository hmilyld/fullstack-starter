package com.hmilyld.fullstack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Data;

@Data
public class BatchRoleUpdateRequest {
@NotEmpty(message = "用户列表不能为空")
private List<Long> userIds;

@NotBlank(message = "角色ID不能为空")
private String roleId;
}

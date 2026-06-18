package com.hmilyld.fullstack.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.dto.RoleCreateRequest;
import com.hmilyld.fullstack.dto.RoleUpdateRequest;
import com.hmilyld.fullstack.service.RoleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @GetMapping("")
    @SaCheckPermission("roles")
    public ApiResponse<?> getRoles(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        return roleService.getRoles(search, page, pageSize);
    }

    @PostMapping("")
    @SaCheckPermission("roles.create")
    public ApiResponse<?> createRole(@RequestBody @Valid RoleCreateRequest req) {
        return roleService.createRole(req);
    }

    @PutMapping("/{id}")
    @SaCheckPermission("roles.edit")
    public ApiResponse<?> updateRole(@PathVariable String id, @RequestBody RoleUpdateRequest req) {
        return roleService.updateRole(id, req);
    }

    @DeleteMapping("/{id}")
    @SaCheckPermission("roles.delete")
    public ApiResponse<?> deleteRole(@PathVariable String id) {
        return roleService.deleteRole(id);
    }
}

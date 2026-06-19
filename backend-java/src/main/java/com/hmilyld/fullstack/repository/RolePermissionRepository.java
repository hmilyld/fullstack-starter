package com.hmilyld.fullstack.repository;

import com.hmilyld.fullstack.entity.RolePermission;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {
List<RolePermission> findByRoleId(String roleId);

void deleteByRoleId(String roleId);

void deleteByPermissionCode(String permissionCode);

@Query("SELECT rp.permissionCode FROM RolePermission rp WHERE rp.roleId = :roleId")
List<String> findPermissionCodesByRoleId(@Param("roleId") String roleId);

@Query("SELECT DISTINCT rp.permissionCode FROM RolePermission rp")
List<String> findAllPermissionCodes();
}

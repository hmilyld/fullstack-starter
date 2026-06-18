package com.hmilyld.fullstack.repository;

import com.hmilyld.fullstack.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, String> {
    List<Permission> findByType(String type);
    List<Permission> findByParent(String parent);
    List<Permission> findByTypeAndParent(String type, String parent);
}

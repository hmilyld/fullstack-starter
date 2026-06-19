package com.hmilyld.fullstack.repository;

import com.hmilyld.fullstack.entity.Permission;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, String> {
List<Permission> findByType(String type);

List<Permission> findByParent(String parent);

List<Permission> findByTypeAndParent(String type, String parent);
}

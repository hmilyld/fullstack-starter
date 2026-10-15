package com.hmilyld.fullstack.repository;

import com.hmilyld.fullstack.entity.MenuItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, String> {
List<MenuItem> findAllByOrderBySortOrderAscPermissionCodeAsc();

long countByGroupId(String groupId);

long countByGroupIdAndPermissionCodeNot(String groupId, String permissionCode);
}

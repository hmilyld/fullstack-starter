package com.hmilyld.fullstack.repository;

import com.hmilyld.fullstack.entity.MenuGroup;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MenuGroupRepository extends JpaRepository<MenuGroup, String> {
List<MenuGroup> findAllByOrderBySortOrderAscIdAsc();
}

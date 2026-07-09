package com.hmilyld.fullstack.repository;

import com.hmilyld.fullstack.entity.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {

@Query(
	"SELECT r FROM Role r WHERE "
		+ "(:search = '' OR LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%')) "
		+ "OR LOWER(r.description) LIKE LOWER(CONCAT('%', :search, '%')))")
Page<Role> search(@Param("search") String search, Pageable pageable);
}

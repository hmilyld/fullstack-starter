package com.hmilyld.fullstack.repository;

import com.hmilyld.fullstack.entity.User;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
Optional<User> findByUsername(String username);

Optional<User> findByEmail(String email);

long countByRoleId(String roleId);

@Query(
	"SELECT u FROM User u WHERE "
		+ "(:search = '' OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) "
		+ "OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) "
		+ "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
Page<User> search(@Param("search") String search, Pageable pageable);
}

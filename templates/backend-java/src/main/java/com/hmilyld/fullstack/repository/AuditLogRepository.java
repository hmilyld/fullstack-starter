package com.hmilyld.fullstack.repository;

import com.hmilyld.fullstack.entity.AuditLog;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

@Query(
	"SELECT a FROM AuditLog a WHERE "
		+ "(:userId IS NULL OR a.userId = :userId) "
		+ "AND (:status = '' OR a.status = :status) "
		+ "AND (:action = '' OR LOWER(a.action) LIKE LOWER(CONCAT('%', :action, '%'))) "
		+ "AND (:startTime IS NULL OR a.createdAt >= :startTime) "
		+ "AND (:endTime IS NULL OR a.createdAt <= :endTime)")
Page<AuditLog> search(
	@Param("userId") Long userId,
	@Param("status") String status,
	@Param("action") String action,
	@Param("startTime") LocalDateTime startTime,
	@Param("endTime") LocalDateTime endTime,
	Pageable pageable);
}

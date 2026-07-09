package com.hmilyld.fullstack.repository;

import com.hmilyld.fullstack.entity.SystemConfig;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, Long> {
Optional<SystemConfig> findById(Long id);
}

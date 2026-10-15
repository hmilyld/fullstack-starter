package com.hmilyld.fullstack.repository;

import com.hmilyld.fullstack.entity.AppState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppStateRepository extends JpaRepository<AppState, Long> {}

package com.hmilyld.fullstack.repository;

import com.hmilyld.fullstack.entity.AiModel;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AiModelRepository extends JpaRepository<AiModel, Long> {
Optional<AiModel> findByAlias(String alias);

Optional<AiModel> findByDefaultModelTrue();

@Query(
	"SELECT a FROM AiModel a WHERE "
		+ "(:search = '' OR LOWER(a.alias) LIKE LOWER(CONCAT('%', :search, '%')) "
		+ "OR LOWER(a.modelName) LIKE LOWER(CONCAT('%', :search, '%')))")
Page<AiModel> search(@Param("search") String search, Pageable pageable);
}

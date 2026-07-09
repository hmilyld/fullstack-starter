package com.hmilyld.fullstack.repository;

import com.hmilyld.fullstack.entity.AiModelPreset;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AiModelPresetRepository extends JpaRepository<AiModelPreset, Long> {
List<AiModelPreset> findByActiveTrueOrderBySortOrderAscIdAsc();

@Query("SELECT DISTINCT p.groupName FROM AiModelPreset p ORDER BY p.groupName")
List<String> findDistinctGroups();

@Query(
	"SELECT p FROM AiModelPreset p WHERE "
		+ "(:search = '' OR LOWER(p.alias) LIKE LOWER(CONCAT('%', :search, '%')) "
		+ "OR LOWER(p.modelName) LIKE LOWER(CONCAT('%', :search, '%'))) "
		+ "AND (:groupName = '' OR p.groupName = :groupName) "
		+ "AND (:isActive IS NULL OR p.active = :isActive) "
		+ "ORDER BY p.sortOrder ASC, p.id ASC")
List<AiModelPreset> searchWithFilters(
	@Param("search") String search,
	@Param("groupName") String groupName,
	@Param("isActive") Boolean isActive);
}

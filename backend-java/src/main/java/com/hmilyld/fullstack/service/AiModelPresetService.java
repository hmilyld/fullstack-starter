package com.hmilyld.fullstack.service;

import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.dto.AiModelPresetCreateRequest;
import com.hmilyld.fullstack.dto.AiModelPresetUpdateRequest;
import com.hmilyld.fullstack.entity.AiModelPreset;
import com.hmilyld.fullstack.repository.AiModelPresetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiModelPresetService {

    @Autowired
    private AiModelPresetRepository presetRepository;

    public ApiResponse<?> getPresets(String search, String group) {
        List<AiModelPreset> presets = presetRepository.searchWithFilters(
                search != null ? search : "",
                group != null ? group : "",
                null
        );
        return ApiResponse.success(presets.stream().map(this::toOutMap).toList());
    }

    public ApiResponse<?> getGroups() {
        return ApiResponse.success(presetRepository.findDistinctGroups());
    }

    public ApiResponse<?> getActivePresets() {
        List<AiModelPreset> presets = presetRepository.findByIsActiveTrueOrderBySortOrderAscIdAsc();
        return ApiResponse.success(presets.stream().map(this::toOutMap).toList());
    }

    public ApiResponse<?> getPreset(Long id) {
        return presetRepository.findById(id)
                .map(preset -> ApiResponse.success(toOutMap(preset)))
                .orElse(ApiResponse.error("预设模型不存在"));
    }

    public ApiResponse<?> createPreset(AiModelPresetCreateRequest req) {
        AiModelPreset preset = new AiModelPreset();
        preset.setGroupName(req.getGroup());
        preset.setAlias(req.getAlias());
        preset.setModelName(req.getModelName());
        preset.setApiUrl(req.getApiUrl());
        preset.setDescription(req.getDescription() != null ? req.getDescription() : "");
        preset.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);
        preset.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        presetRepository.save(preset);

        return ApiResponse.success(toOutMap(preset));
    }

    public ApiResponse<?> updatePreset(Long id, AiModelPresetUpdateRequest req) {
        return presetRepository.findById(id).map(preset -> {
            if (req.getGroup() != null) preset.setGroupName(req.getGroup());
            if (req.getAlias() != null) preset.setAlias(req.getAlias());
            if (req.getModelName() != null) preset.setModelName(req.getModelName());
            if (req.getApiUrl() != null) preset.setApiUrl(req.getApiUrl());
            if (req.getDescription() != null) preset.setDescription(req.getDescription());
            if (req.getIsActive() != null) preset.setIsActive(req.getIsActive());
            if (req.getSortOrder() != null) preset.setSortOrder(req.getSortOrder());
            presetRepository.save(preset);
            return ApiResponse.success(toOutMap(preset));
        }).orElse(ApiResponse.error("预设模型不存在"));
    }

    public ApiResponse<?> deletePreset(Long id) {
        return presetRepository.findById(id).map(preset -> {
            presetRepository.delete(preset);
            return ApiResponse.success();
        }).orElse(ApiResponse.error("预设模型不存在"));
    }

    private Map<String, Object> toOutMap(AiModelPreset preset) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", String.valueOf(preset.getId()));
        map.put("group", preset.getGroupName());
        map.put("alias", preset.getAlias());
        map.put("modelName", preset.getModelName());
        map.put("apiUrl", preset.getApiUrl());
        map.put("description", preset.getDescription() != null ? preset.getDescription() : "");
        map.put("isActive", preset.getIsActive());
        map.put("sortOrder", preset.getSortOrder());
        return map;
    }
}

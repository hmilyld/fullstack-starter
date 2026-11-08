package com.hmilyld.fullstack.service;

import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.common.ConflictException;
import com.hmilyld.fullstack.common.NotFoundException;
import com.hmilyld.fullstack.dto.AiModelPresetCreateRequest;
import com.hmilyld.fullstack.dto.AiModelPresetResponse;
import com.hmilyld.fullstack.dto.AiModelPresetUpdateRequest;
import com.hmilyld.fullstack.entity.AiModelPreset;
import com.hmilyld.fullstack.repository.AiModelPresetRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** AI 模型预设领域。 */
@Service
public class AiModelPresetService {

  @Autowired private AiModelPresetRepository presetRepository;

  public ApiResponse<?> getPresets(String search, String group) {
    List<AiModelPreset> presets =
        presetRepository.searchWithFilters(
            search != null ? search : "", group != null ? group : "", null);
    return ApiResponse.success(presets.stream().map(AiModelPresetService::toResponse).toList());
  }

  public ApiResponse<?> getGroups() {
    return ApiResponse.success(presetRepository.findDistinctGroups());
  }

  public ApiResponse<?> getActivePresets() {
    List<AiModelPreset> presets = presetRepository.findByActiveTrueOrderBySortOrderAscIdAsc();
    return ApiResponse.success(presets.stream().map(AiModelPresetService::toResponse).toList());
  }

  public ApiResponse<?> getPreset(Long id) {
    AiModelPreset preset =
        presetRepository.findById(id).orElseThrow(() -> new NotFoundException("预设模型不存在"));
    return ApiResponse.success(toResponse(preset));
  }

  @Transactional
  public ApiResponse<?> createPreset(AiModelPresetCreateRequest req) {
    if (presetRepository.findByAlias(req.getAlias()).isPresent()) {
      throw new ConflictException("预设模型别名已存在");
    }
    AiModelPreset preset = new AiModelPreset();
    preset.setGroupName(req.getGroup());
    preset.setAlias(req.getAlias());
    preset.setModelName(req.getModelName());
    preset.setApiUrl(req.getApiUrl());
    preset.setDescription(req.getDescription() != null ? req.getDescription() : "");
    preset.setActive(req.getIsActive() != null ? req.getIsActive() : true);
    preset.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
    presetRepository.save(preset);

    return ApiResponse.success(toResponse(preset));
  }

  @Transactional
  public ApiResponse<?> updatePreset(Long id, AiModelPresetUpdateRequest req) {
    AiModelPreset preset =
        presetRepository.findById(id).orElseThrow(() -> new NotFoundException("预设模型不存在"));

    if (req.getAlias() != null && !req.getAlias().equals(preset.getAlias())) {
      if (presetRepository.findByAlias(req.getAlias()).isPresent()) {
        throw new ConflictException("预设模型别名已存在");
      }
    }

    if (req.getGroup() != null) preset.setGroupName(req.getGroup());
    if (req.getAlias() != null) preset.setAlias(req.getAlias());
    if (req.getModelName() != null) preset.setModelName(req.getModelName());
    if (req.getApiUrl() != null) preset.setApiUrl(req.getApiUrl());
    if (req.getDescription() != null) preset.setDescription(req.getDescription());
    if (req.getIsActive() != null) preset.setActive(req.getIsActive());
    if (req.getSortOrder() != null) preset.setSortOrder(req.getSortOrder());
    presetRepository.save(preset);
    return ApiResponse.success(toResponse(preset));
  }

  @Transactional
  public ApiResponse<?> deletePreset(Long id) {
    AiModelPreset preset =
        presetRepository.findById(id).orElseThrow(() -> new NotFoundException("预设模型不存在"));
    presetRepository.delete(preset);
    return ApiResponse.success();
  }

  public static AiModelPresetResponse toResponse(AiModelPreset preset) {
    return new AiModelPresetResponse(
        String.valueOf(preset.getId()),
        preset.getGroupName(),
        preset.getAlias(),
        preset.getModelName(),
        preset.getApiUrl(),
        preset.getDescription() != null ? preset.getDescription() : "",
        Boolean.TRUE.equals(preset.getActive()),
        preset.getSortOrder() == null ? 0 : preset.getSortOrder());
  }
}

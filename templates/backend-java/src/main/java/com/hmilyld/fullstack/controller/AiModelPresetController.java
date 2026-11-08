package com.hmilyld.fullstack.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import cn.dev33.satoken.annotation.SaMode;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.dto.AiModelPresetCreateRequest;
import com.hmilyld.fullstack.dto.AiModelPresetResponse;
import com.hmilyld.fullstack.dto.AiModelPresetUpdateRequest;
import com.hmilyld.fullstack.service.AiModelPresetService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai-models/presets")
public class AiModelPresetController {

  @Autowired private AiModelPresetService presetService;

  @GetMapping("")
  @SaCheckPermission("ai_models")
  public ApiResponse<List<AiModelPresetResponse>> getPresets(
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "") String group) {
    return presetService.getPresets(search, group);
  }

  @GetMapping("/groups")
  @SaCheckPermission("ai_models")
  public ApiResponse<List<String>> getGroups() {
    return presetService.getGroups();
  }

  @GetMapping("/active")
  public ApiResponse<List<AiModelPresetResponse>> getActivePresets() {
    return presetService.getActivePresets();
  }

  @GetMapping("/{id}")
  @SaCheckPermission("ai_models")
  public ApiResponse<AiModelPresetResponse> getPreset(@PathVariable Long id) {
    return presetService.getPreset(id);
  }

  @PostMapping("")
  @SaCheckPermission(
      value = {"ai_models.create", "ai_models.presets.create"},
      mode = SaMode.OR)
  public ApiResponse<AiModelPresetResponse> createPreset(
      @RequestBody @Valid AiModelPresetCreateRequest req) {
    return presetService.createPreset(req);
  }

  @PutMapping("/{id}")
  @SaCheckPermission(
      value = {"ai_models.edit", "ai_models.presets.edit"},
      mode = SaMode.OR)
  public ApiResponse<AiModelPresetResponse> updatePreset(
      @PathVariable Long id, @RequestBody AiModelPresetUpdateRequest req) {
    return presetService.updatePreset(id, req);
  }

  @DeleteMapping("/{id}")
  @SaCheckPermission(
      value = {"ai_models.delete", "ai_models.presets.delete"},
      mode = SaMode.OR)
  public ApiResponse<Void> deletePreset(@PathVariable Long id) {
    return presetService.deletePreset(id);
  }
}

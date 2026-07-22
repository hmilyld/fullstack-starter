package com.hmilyld.fullstack.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import cn.dev33.satoken.annotation.SaMode;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.dto.AiModelPresetCreateRequest;
import com.hmilyld.fullstack.dto.AiModelPresetUpdateRequest;
import com.hmilyld.fullstack.service.AiModelPresetService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai-models/presets")
public class AiModelPresetController {

@Autowired private AiModelPresetService presetService;

@GetMapping("")
@SaCheckPermission("ai_models")
public ApiResponse<?> getPresets(
	@RequestParam(defaultValue = "") String search,
	@RequestParam(defaultValue = "") String group) {
	return presetService.getPresets(search, group);
}

@GetMapping("/groups")
@SaCheckPermission("ai_models")
public ApiResponse<?> getGroups() {
	return presetService.getGroups();
}

@GetMapping("/active")
public ApiResponse<?> getActivePresets() {
	return presetService.getActivePresets();
}

@GetMapping("/{id}")
@SaCheckPermission("ai_models")
public ApiResponse<?> getPreset(@PathVariable Long id) {
	return presetService.getPreset(id);
}

@PostMapping("")
@SaCheckPermission(value = {"ai_models.create", "ai_models.presets.create"}, mode = SaMode.AND)
public ApiResponse<?> createPreset(@RequestBody @Valid AiModelPresetCreateRequest req) {
	return presetService.createPreset(req);
}

@PutMapping("/{id}")
@SaCheckPermission(value = {"ai_models.edit", "ai_models.presets.edit"}, mode = SaMode.AND)
public ApiResponse<?> updatePreset(
	@PathVariable Long id, @RequestBody AiModelPresetUpdateRequest req) {
	return presetService.updatePreset(id, req);
}

@DeleteMapping("/{id}")
@SaCheckPermission(value = {"ai_models.delete", "ai_models.presets.delete"}, mode = SaMode.AND)
public ApiResponse<?> deletePreset(@PathVariable Long id) {
	return presetService.deletePreset(id);
}
}

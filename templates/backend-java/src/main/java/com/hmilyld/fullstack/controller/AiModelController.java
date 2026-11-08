package com.hmilyld.fullstack.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.common.PageResult;
import com.hmilyld.fullstack.dto.AiModelCreateRequest;
import com.hmilyld.fullstack.dto.AiModelPublicResponse;
import com.hmilyld.fullstack.dto.AiModelResponse;
import com.hmilyld.fullstack.dto.AiModelTestRequest;
import com.hmilyld.fullstack.dto.AiModelTestResult;
import com.hmilyld.fullstack.dto.AiModelUpdateRequest;
import com.hmilyld.fullstack.service.AiModelService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai-models")
public class AiModelController {

  @Autowired private AiModelService aiModelService;

  @GetMapping("")
  @SaCheckPermission("ai_models")
  public ApiResponse<PageResult<AiModelResponse>> getAiModels(
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "10") int pageSize) {
    return aiModelService.getAiModels(search, page, pageSize);
  }

  @GetMapping("/default")
  public ApiResponse<AiModelPublicResponse> getDefaultModel() {
    return aiModelService.getDefaultModel();
  }

  @GetMapping("/by-alias/{alias}")
  public ApiResponse<AiModelPublicResponse> getByAlias(@PathVariable String alias) {
    return aiModelService.getModelByAlias(alias);
  }

  @GetMapping("/{id}")
  @SaCheckPermission("ai_models")
  public ApiResponse<AiModelResponse> getAiModel(@PathVariable Long id) {
    return aiModelService.getAiModel(id);
  }

  @PostMapping("")
  @SaCheckPermission("ai_models.create")
  public ApiResponse<AiModelResponse> createAiModel(@RequestBody @Valid AiModelCreateRequest req) {
    return aiModelService.createAiModel(req);
  }

  @PutMapping("/{id}")
  @SaCheckPermission("ai_models.edit")
  public ApiResponse<AiModelResponse> updateAiModel(
      @PathVariable Long id, @RequestBody AiModelUpdateRequest req) {
    return aiModelService.updateAiModel(id, req);
  }

  @DeleteMapping("/{id}")
  @SaCheckPermission("ai_models.delete")
  public ApiResponse<Void> deleteAiModel(@PathVariable Long id) {
    return aiModelService.deleteAiModel(id);
  }

  @PostMapping("/test")
  @SaCheckPermission("ai_models")
  public ApiResponse<AiModelTestResult> testAiModel(@RequestBody @Valid AiModelTestRequest req) {
    return aiModelService.testAiModel(req);
  }
}

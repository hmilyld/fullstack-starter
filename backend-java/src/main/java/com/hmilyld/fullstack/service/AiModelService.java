package com.hmilyld.fullstack.service;

import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.common.PageResult;
import com.hmilyld.fullstack.dto.AiModelCreateRequest;
import com.hmilyld.fullstack.dto.AiModelTestRequest;
import com.hmilyld.fullstack.dto.AiModelTestResult;
import com.hmilyld.fullstack.dto.AiModelUpdateRequest;
import com.hmilyld.fullstack.entity.AiModel;
import com.hmilyld.fullstack.repository.AiModelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
public class AiModelService {

    @Autowired
    private AiModelRepository aiModelRepository;

    public ApiResponse<?> getAiModels(String search, int page, int pageSize) {
        Page<AiModel> modelPage = aiModelRepository.search(search,
                PageRequest.of(page - 1, pageSize));

        PageResult<Map<String, Object>> result = new PageResult<>(
                modelPage.getContent().stream().map(this::toOutMap).toList(),
                modelPage.getTotalElements(),
                page,
                pageSize
        );
        return ApiResponse.success(result);
    }

    public ApiResponse<?> getAiModel(Long id) {
        return aiModelRepository.findById(id)
                .map(model -> ApiResponse.success(toOutMap(model)))
                .orElse(ApiResponse.error("模型不存在"));
    }

    public ApiResponse<?> createAiModel(AiModelCreateRequest req) {
        if (aiModelRepository.findByAlias(req.getAlias()).isPresent()) {
            return ApiResponse.error("别名已存在");
        }

        if (Boolean.TRUE.equals(req.getIsDefault())) {
            unsetDefaultModels();
        }

        AiModel model = new AiModel();
        model.setAlias(req.getAlias());
        model.setModelName(req.getModelName());
        model.setApiUrl(req.getApiUrl());
        model.setApiKey(req.getApiKey());
        model.setDescription(req.getDescription() != null ? req.getDescription() : "");
        model.setIsDefault(req.getIsDefault() != null ? req.getIsDefault() : false);
        aiModelRepository.save(model);

        return ApiResponse.success(toOutMap(model));
    }

    public ApiResponse<?> updateAiModel(Long id, AiModelUpdateRequest req) {
        return aiModelRepository.findById(id).map(model -> {
            if (req.getAlias() != null) {
                if (!req.getAlias().equals(model.getAlias()) &&
                    aiModelRepository.findByAlias(req.getAlias()).isPresent()) {
                    return ApiResponse.<Object>error("别名已存在");
                }
                model.setAlias(req.getAlias());
            }
            if (req.getModelName() != null) model.setModelName(req.getModelName());
            if (req.getApiUrl() != null) model.setApiUrl(req.getApiUrl());
            if (req.getApiKey() != null) model.setApiKey(req.getApiKey());
            if (req.getDescription() != null) model.setDescription(req.getDescription());
            if (req.getIsDefault() != null) {
                if (req.getIsDefault()) unsetDefaultModels();
                model.setIsDefault(req.getIsDefault());
            }
            aiModelRepository.save(model);
            return ApiResponse.success(toOutMap(model));
        }).orElse(ApiResponse.error("模型不存在"));
    }

    public ApiResponse<?> deleteAiModel(Long id) {
        return aiModelRepository.findById(id).map(model -> {
            aiModelRepository.delete(model);
            return ApiResponse.success();
        }).orElse(ApiResponse.error("模型不存在"));
    }

    public ApiResponse<?> getDefaultModel() {
        return aiModelRepository.findByIsDefaultTrue()
                .map(model -> ApiResponse.success(toPublicOutMap(model)))
                .orElse(ApiResponse.error("未配置默认模型"));
    }

    public ApiResponse<?> getModelByAlias(String alias) {
        return aiModelRepository.findByAlias(alias)
                .map(model -> ApiResponse.success(toPublicOutMap(model)))
                .orElse(ApiResponse.error("模型不存在"));
    }

    public ApiResponse<?> testAiModel(AiModelTestRequest req) {
        long startTime = System.currentTimeMillis();

        Map<String, Object> payload = new HashMap<>();
        payload.put("model", req.getModelName());
        payload.put("messages", java.util.List.of(
                Map.of("role", "user", "content", "Hi, please reply with one word: OK")
        ));
        payload.put("max_tokens", 10);
        payload.put("temperature", 0);

        try {
            Map<String, Object> response = WebClient.create()
                    .post()
                    .uri(req.getApiUrl())
                    .header("Authorization", "Bearer " + req.getApiKey())
                    .header("Content-Type", "application/json")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            long responseTime = System.currentTimeMillis() - startTime;
            String modelName = (String) response.getOrDefault("model", req.getModelName());
            return ApiResponse.success(new AiModelTestResult(true,
                    "连接成功，响应时间: " + responseTime + "ms",
                    (double) responseTime, modelName));
        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            String message = e.getMessage();
            if (message != null && message.contains("timeout")) {
                message = "连接超时 (" + responseTime + "ms)，请检查API地址是否正确";
            } else if (message != null && message.contains("Connection refused")) {
                message = "无法连接到服务器，请检查API地址";
            } else {
                message = "测试失败: " + (message != null ? message : "未知错误");
            }
            return ApiResponse.success(new AiModelTestResult(false, message,
                    (double) responseTime, null));
        }
    }

    private void unsetDefaultModels() {
        aiModelRepository.findByIsDefaultTrue().ifPresent(model -> {
            model.setIsDefault(false);
            aiModelRepository.save(model);
        });
    }

    private Map<String, Object> toOutMap(AiModel model) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", String.valueOf(model.getId()));
        map.put("alias", model.getAlias());
        map.put("modelName", model.getModelName());
        map.put("apiUrl", model.getApiUrl());
        map.put("apiKey", model.getApiKey());
        map.put("description", model.getDescription() != null ? model.getDescription() : "");
        map.put("isDefault", model.getIsDefault());
        return map;
    }

    private Map<String, Object> toPublicOutMap(AiModel model) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", String.valueOf(model.getId()));
        map.put("alias", model.getAlias());
        map.put("modelName", model.getModelName());
        map.put("apiUrl", model.getApiUrl());
        map.put("description", model.getDescription() != null ? model.getDescription() : "");
        map.put("isDefault", model.getIsDefault());
        return map;
    }
}

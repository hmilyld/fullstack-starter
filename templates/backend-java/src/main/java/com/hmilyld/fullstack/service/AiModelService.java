package com.hmilyld.fullstack.service;

import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.common.ConflictException;
import com.hmilyld.fullstack.common.NotFoundException;
import com.hmilyld.fullstack.common.PageResult;
import com.hmilyld.fullstack.dto.AiModelCreateRequest;
import com.hmilyld.fullstack.dto.AiModelPublicResponse;
import com.hmilyld.fullstack.dto.AiModelResponse;
import com.hmilyld.fullstack.dto.AiModelTestRequest;
import com.hmilyld.fullstack.dto.AiModelTestResult;
import com.hmilyld.fullstack.dto.AiModelUpdateRequest;
import com.hmilyld.fullstack.entity.AiModel;
import com.hmilyld.fullstack.repository.AiModelRepository;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

/** AI 模型领域，含连接测试。 */
@Service
public class AiModelService {

  @Autowired private AiModelRepository aiModelRepository;
  @Autowired private WebClient webClient;

  public ApiResponse<PageResult<AiModelResponse>> getAiModels(
      String search, int page, int pageSize) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));

    Page<AiModel> modelPage =
        aiModelRepository.search(
            search, PageRequest.of(page - 1, pageSize, Sort.by("id").ascending()));

    PageResult<AiModelResponse> result =
        new PageResult<>(
            modelPage.getContent().stream().map(AiModelService::toResponse).toList(),
            modelPage.getTotalElements(),
            page,
            pageSize);
    return ApiResponse.success(result);
  }

  public ApiResponse<AiModelResponse> getAiModel(Long id) {
    AiModel model =
        aiModelRepository.findById(id).orElseThrow(() -> new NotFoundException("模型不存在"));
    return ApiResponse.success(toResponse(model));
  }

  @Transactional
  public ApiResponse<AiModelResponse> createAiModel(AiModelCreateRequest req) {
    assertSafeUrl(req.getApiUrl());
    if (aiModelRepository.findByAlias(req.getAlias()).isPresent()) {
      throw new ConflictException("别名已存在");
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
    model.setDefaultModel(req.getIsDefault() != null ? req.getIsDefault() : false);
    aiModelRepository.save(model);

    return ApiResponse.success(toResponse(model));
  }

  @Transactional
  public ApiResponse<AiModelResponse> updateAiModel(Long id, AiModelUpdateRequest req) {
    AiModel model =
        aiModelRepository.findById(id).orElseThrow(() -> new NotFoundException("模型不存在"));

    if (req.getAlias() != null && !req.getAlias().equals(model.getAlias())) {
      if (aiModelRepository.findByAlias(req.getAlias()).isPresent()) {
        throw new ConflictException("别名已存在");
      }
      model.setAlias(req.getAlias());
    }
    if (req.getModelName() != null) model.setModelName(req.getModelName());
    if (req.getApiUrl() != null) {
      assertSafeUrl(req.getApiUrl());
      model.setApiUrl(req.getApiUrl());
    }
    // 防止脱敏值被回写覆盖真实密钥
    if (req.getApiKey() != null
        && !req.getApiKey().isBlank()
        && !req.getApiKey().contains("****")) {
      model.setApiKey(req.getApiKey());
    }
    if (req.getDescription() != null) model.setDescription(req.getDescription());
    if (req.getIsDefault() != null) {
      if (req.getIsDefault()) unsetDefaultModels();
      model.setDefaultModel(req.getIsDefault());
    }
    aiModelRepository.save(model);
    return ApiResponse.success(toResponse(model));
  }

  @Transactional
  public ApiResponse<Void> deleteAiModel(Long id) {
    AiModel model =
        aiModelRepository.findById(id).orElseThrow(() -> new NotFoundException("模型不存在"));
    aiModelRepository.delete(model);
    return ApiResponse.success();
  }

  public ApiResponse<AiModelPublicResponse> getDefaultModel() {
    AiModel model =
        aiModelRepository
            .findByDefaultModelTrue()
            .orElseThrow(() -> new NotFoundException("未配置默认模型"));
    return ApiResponse.success(toPublicResponse(model));
  }

  public ApiResponse<AiModelPublicResponse> getModelByAlias(String alias) {
    AiModel model =
        aiModelRepository.findByAlias(alias).orElseThrow(() -> new NotFoundException("模型不存在"));
    return ApiResponse.success(toPublicResponse(model));
  }

  public ApiResponse<AiModelTestResult> testAiModel(AiModelTestRequest req) {
    String apiUrl = req.getApiUrl();
    String apiKey = req.getApiKey();
    String modelName = req.getModelName();

    if (req.getModelId() != null) {
      AiModel model =
          aiModelRepository
              .findById(req.getModelId())
              .orElseThrow(() -> new NotFoundException("模型不存在"));
      apiUrl = model.getApiUrl();
      apiKey = model.getApiKey();
      modelName = model.getModelName();
    } else if (apiUrl == null
        || apiUrl.isBlank()
        || apiKey == null
        || apiKey.isBlank()
        || modelName == null
        || modelName.isBlank()) {
      throw new NotFoundException("API地址、API Key 和模型名称不能为空");
    }

    assertSafeUrl(apiUrl);
    long startTime = System.currentTimeMillis();

    Map<String, Object> payload = new HashMap<>();
    payload.put("model", modelName);
    payload.put(
        "messages",
        List.of(Map.of("role", "user", "content", "Hi, please reply with one word: OK")));
    payload.put("max_tokens", 10);
    payload.put("temperature", 0);

    try {
      Map<?, ?> response =
          webClient
              .post()
              .uri(apiUrl)
              .header("Authorization", "Bearer " + apiKey)
              .bodyValue(payload)
              .retrieve()
              .bodyToMono(Map.class)
              .timeout(Duration.ofSeconds(30))
              .block();

      long responseTime = System.currentTimeMillis() - startTime;
      if (response == null) {
        return ApiResponse.success(
            new AiModelTestResult(false, "服务器返回空响应", (double) responseTime, null));
      }
      Object actual = response.get("model");
      String actualModel = actual instanceof String s ? s : modelName;
      return ApiResponse.success(
          new AiModelTestResult(
              true, "连接成功，响应时间: " + responseTime + "ms", (double) responseTime, actualModel));
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
      return ApiResponse.success(
          new AiModelTestResult(false, message, (double) responseTime, null));
    }
  }

  private void unsetDefaultModels() {
    aiModelRepository
        .findByDefaultModelTrue()
        .ifPresent(
            model -> {
              model.setDefaultModel(false);
              aiModelRepository.save(model);
            });
  }

  public static AiModelResponse toResponse(AiModel model) {
    return new AiModelResponse(
        String.valueOf(model.getId()),
        model.getAlias(),
        model.getModelName(),
        model.getApiUrl(),
        maskApiKey(model.getApiKey()),
        model.getDescription() != null ? model.getDescription() : "",
        Boolean.TRUE.equals(model.getDefaultModel()));
  }

  public static AiModelPublicResponse toPublicResponse(AiModel model) {
    return new AiModelPublicResponse(
        String.valueOf(model.getId()),
        model.getAlias(),
        model.getModelName(),
        model.getApiUrl(),
        model.getDescription() != null ? model.getDescription() : "",
        Boolean.TRUE.equals(model.getDefaultModel()));
  }

  /** 脱敏 API Key，短于12位完全隐藏，否则只显示前2位和后2位。 */
  static String maskApiKey(String apiKey) {
    if (apiKey == null || apiKey.length() < 12) {
      return "****";
    }
    return apiKey.substring(0, 2) + "****" + apiKey.substring(apiKey.length() - 2);
  }

  /**
   * SSRF 防护：拒绝非 http/https、私有/回环/链路本地地址及云元数据端点。
   *
   * <p>域名必须先解析再判定——{@code 127.0.0.1.nip.io} 这类域名会解析到内网。
   */
  static void assertSafeUrl(String url) {
    if (url == null || url.isBlank()) {
      throw new IllegalArgumentException("API 地址不能为空");
    }
    java.net.URI uri;
    try {
      uri = java.net.URI.create(url);
    } catch (Exception e) {
      throw new IllegalArgumentException("API 地址格式无效");
    }
    String scheme = uri.getScheme();
    if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
      throw new IllegalArgumentException("API 地址必须使用 http 或 https 协议");
    }
    String host = uri.getHost();
    if (host == null || host.isBlank()) {
      throw new IllegalArgumentException("API 地址格式无效");
    }
    String lower = host.toLowerCase();
    if (lower.equals("169.254.169.254")
        || lower.equals("metadata.google.internal")
        || lower.contains("metadata")) {
      throw new IllegalArgumentException("禁止访问元数据端点");
    }

    // IP 字面量直接判定
    java.net.InetAddress literal = parseLiteral(lower);
    if (literal != null) {
      assertPublicAddress(literal, lower);
      return;
    }

    // 域名：解析后逐条判定；无法解析时放行（与 Python 侧一致）
    try {
      for (java.net.InetAddress addr : java.net.InetAddress.getAllByName(host)) {
        assertPublicAddress(addr, host);
      }
    } catch (java.net.UnknownHostException ignored) {
      // 离线或内网 DNS，无法静态判定，交由请求层防护
    }
  }

  private static java.net.InetAddress parseLiteral(String host) {
    try {
      return java.net.InetAddress.getByName(host);
    } catch (java.net.UnknownHostException e) {
      return null;
    }
  }

  private static void assertPublicAddress(java.net.InetAddress addr, String host) {
    if (addr.isSiteLocalAddress() || addr.isLoopbackAddress() || addr.isLinkLocalAddress()) {
      throw new IllegalArgumentException(
          "禁止访问内网地址（" + host + " 解析为 " + addr.getHostAddress() + "）");
    }
    if (addr.isAnyLocalAddress() || addr.isMulticastAddress()) {
      throw new IllegalArgumentException("禁止访问该地址");
    }
  }
}

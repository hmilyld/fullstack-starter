package com.hmilyld.fullstack;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hmilyld.fullstack.catalog.PermissionCatalog;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * 可执行契约测试，对应 {@code docs/contract/api.md}。
 *
 * <p>与 Python 侧 {@code tests/test_contract.py} 断言同一份契约： 端点集合、响应信封、资源形状与关键语义。两栈都必须让这套测试通过。
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ContractTest {

  private static final String ADMIN_ACCOUNT = "admin";
  private static final String ADMIN_PASSWORD = "123456";

  /** 契约声明的 55 个端点；路径参数名已抹平。 */
  private static final Set<String> CONTRACT_ENDPOINTS =
      Set.of(
          "POST /api/auth/login",
          "POST /api/auth/register",
          "POST /api/auth/logout",
          "GET /api/users",
          "POST /api/users",
          "POST /api/users/batch-role",
          "PUT /api/users/me",
          "PUT /api/users/me/password",
          "GET /api/users/{}",
          "PUT /api/users/{}",
          "DELETE /api/users/{}",
          "PUT /api/users/{}/reset-password",
          "GET /api/roles",
          "POST /api/roles",
          "PUT /api/roles/{}",
          "DELETE /api/roles/{}",
          "GET /api/permissions",
          "POST /api/permissions",
          "POST /api/permissions/sync",
          "PUT /api/permissions/{}",
          "DELETE /api/permissions/{}",
          "GET /api/menus/navigation",
          "GET /api/menus",
          "POST /api/menus/groups",
          "PUT /api/menus/groups/{}",
          "DELETE /api/menus/groups/{}",
          "POST /api/menus/items",
          "PUT /api/menus/items/{}",
          "DELETE /api/menus/items/{}",
          "PUT /api/menus/layout",
          "GET /api/system/config",
          "PUT /api/system/config",
          "POST /api/system/test-email",
          "GET /api/public/config",
          "GET /api/dashboard/stats",
          "GET /api/dashboard/activity",
          "GET /api/ai-models",
          "POST /api/ai-models",
          "GET /api/ai-models/default",
          "GET /api/ai-models/by-alias/{}",
          "GET /api/ai-models/{}",
          "PUT /api/ai-models/{}",
          "DELETE /api/ai-models/{}",
          "POST /api/ai-models/test",
          "GET /api/ai-models/presets",
          "GET /api/ai-models/presets/groups",
          "GET /api/ai-models/presets/active",
          "GET /api/ai-models/presets/{}",
          "POST /api/ai-models/presets",
          "PUT /api/ai-models/presets/{}",
          "DELETE /api/ai-models/presets/{}",
          "GET /api/audit-logs",
          "POST /api/data/export",
          "POST /api/data/import",
          "GET /api/data/import/{}");

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;

  private String token;

  @DynamicPropertySource
  static void datasource(DynamicPropertyRegistry registry) {
    String db =
        System.getProperty("java.io.tmpdir") + "/java-contract-" + UUID.randomUUID() + ".db";
    registry.add("spring.datasource.url", () -> "jdbc:sqlite:" + db);
    registry.add(
        "app.data.tmp-dir", () -> System.getProperty("java.io.tmpdir") + "/java-contract-tmp");
    // 契约测试在同一进程内多次登录，放宽限流阈值；生产默认仍为 5 次/分钟
    registry.add("app.rate-limit.max-attempts", () -> "10000");
  }

  // ------------------------------------------------------------ helpers

  private MvcResult call(MockHttpServletRequestBuilder builder, String bearer) throws Exception {
    if (bearer != null) {
      builder.header("Authorization", "Bearer " + bearer);
    }
    return mockMvc.perform(builder).andReturn();
  }

  private JsonNode json(MvcResult result) throws Exception {
    return objectMapper.readTree(result.getResponse().getContentAsString());
  }

  private String login(String account, String password) throws Exception {
    MvcResult result =
        call(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of("account", account, "password", password))),
            null);
    JsonNode body = json(result);
    assertThat(body.get("code").asInt()).as(body.toString()).isZero();
    return body.get("data").get("token").asText();
  }

  private String adminToken() throws Exception {
    if (token == null) {
      token = login(ADMIN_ACCOUNT, ADMIN_PASSWORD);
    }
    return token;
  }

  private static String unique(String prefix) {
    return prefix + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
  }

  private static String normalize(String path) {
    StringBuilder out = new StringBuilder();
    boolean inParam = false;
    for (char c : path.toCharArray()) {
      if (c == '{') {
        inParam = true;
        out.append('{');
      } else if (c == '}') {
        inParam = false;
        out.append('}');
      } else if (!inParam) {
        out.append(c);
      }
    }
    return out.toString();
  }

  private void assertEnvelope(JsonNode body) {
    List<String> keys = new ArrayList<>();
    body.fieldNames().forEachRemaining(keys::add);
    assertThat(keys).containsExactlyInAnyOrder("code", "message", "data");
    assertThat(body.get("code").isInt()).isTrue();
    assertThat(body.get("message").isTextual()).isTrue();
  }

  // ------------------------------------------------------------ 契约完整性

  @Test
  @Order(1)
  void openApiMatchesContractEndpointSet() throws Exception {
    // springdoc 生成的真实 OpenAPI 描述必须与契约端点集合完全一致
    MvcResult result = call(get("/openapi.json"), null);
    assertThat(result.getResponse().getStatus()).isEqualTo(200);
    JsonNode paths = json(result).get("paths");
    assertThat(paths).isNotNull();

    Set<String> actual = new LinkedHashSet<>();
    paths
        .fieldNames()
        .forEachRemaining(
            path -> {
              JsonNode operations = paths.get(path);
              operations
                  .fieldNames()
                  .forEachRemaining(
                      method -> {
                        if (Set.of("get", "post", "put", "delete", "patch").contains(method)) {
                          actual.add(method.toUpperCase() + " " + normalize(path));
                        }
                      });
            });

    assertThat(actual)
        .as("多出: %s\n缺失: %s", minus(actual, CONTRACT_ENDPOINTS), minus(CONTRACT_ENDPOINTS, actual))
        .isEqualTo(CONTRACT_ENDPOINTS);
  }

  private static Set<String> minus(Set<String> left, Set<String> right) {
    Set<String> result = new LinkedHashSet<>(left);
    result.removeAll(right);
    return result;
  }

  // ------------------------------------------------------------ 响应信封

  @Test
  @Order(2)
  void everyEndpointDeclaresResponseSchema() throws Exception {
    // 与 Python 侧 test_every_endpoint_declares_response_schema 对等：
    // 每个端点都必须在 OpenAPI 中有结构化响应，不能退化为自由对象
    MvcResult result = call(get("/openapi.json"), null);
    JsonNode paths = json(result).get("paths");
    List<String> problems = new ArrayList<>();

    paths
        .fieldNames()
        .forEachRemaining(
            path -> {
              JsonNode operations = paths.get(path);
              operations
                  .fieldNames()
                  .forEachRemaining(
                      method -> {
                        if (!Set.of("get", "post", "put", "delete", "patch").contains(method)) {
                          return;
                        }
                        JsonNode responses = operations.get(method).get("responses");
                        String code = responses.has("202") ? "202" : "200";
                        JsonNode content = responses.path(code).path("content");
                        if (content.isMissingNode() || content.isEmpty()) {
                          problems.add(method.toUpperCase() + " " + path + ": 无响应内容");
                        }
                      });
            });

    assertThat(problems).as("响应 schema 不合格: %s", problems).isEmpty();
  }

  @Test
  @Order(3)
  void successEnvelopesAreTyped() throws Exception {
    // 除文件下载外，成功响应必须引用具体的 schema，而不是自由对象
    MvcResult result = call(get("/openapi.json"), null);
    JsonNode paths = json(result).get("paths");
    List<String> problems = new ArrayList<>();

    paths
        .fieldNames()
        .forEachRemaining(
            path -> {
              if ("/api/data/export".equals(path)) {
                return; // 文件下载，不是信封
              }
              JsonNode operations = paths.get(path);
              operations
                  .fieldNames()
                  .forEachRemaining(
                      method -> {
                        if (!Set.of("get", "post", "put", "delete", "patch").contains(method)) {
                          return;
                        }
                        JsonNode responses = operations.get(method).get("responses");
                        String code = responses.has("202") ? "202" : "200";
                        // springdoc 默认的 content key 是 `*/*`（未显式声明 produces），
                        // 因此遍历所有 media type，而不是只查 application/json
                        JsonNode content = responses.path(code).path("content");
                        if (content.isMissingNode() || content.isEmpty()) {
                          problems.add(method.toUpperCase() + " " + path + ": 无响应内容");
                          return;
                        }
                        JsonNode schema = content.elements().next().path("schema");
                        if (schema.isMissingNode() || schema.isEmpty()) {
                          problems.add(method.toUpperCase() + " " + path + ": 缺少 JSON schema");
                          return;
                        }
                        String ref = schema.path("$ref").asText("");
                        // 通配符 ApiResponse<?> 会退化成 ApiResponseObject（data 为任意 JSON），
                        // 与「契约机器可读」相悖，因此也算不合格
                        if (!ref.contains("ApiResponse") || ref.endsWith("ApiResponseObject")) {
                          problems.add(method.toUpperCase() + " " + path + ": 未使用具体信封类型 -> " + ref);
                        }
                      });
            });

    assertThat(problems).as("响应 schema 不合格: %s", problems).isEmpty();
  }

  @Test
  @Order(4)
  void successEnvelope() throws Exception {
    MvcResult result = call(get("/api/users"), adminToken());
    assertThat(result.getResponse().getStatus()).isEqualTo(200);
    JsonNode body = json(result);
    assertEnvelope(body);
    assertThat(body.get("code").asInt()).isZero();
    assertThat(body.get("message").asText()).isEqualTo("success");
  }

  @Test
  @Order(3)
  void businessErrorKeepsDataKey() throws Exception {
    MvcResult result = call(get("/api/users/999999"), adminToken());
    assertThat(result.getResponse().getStatus()).isEqualTo(200);
    JsonNode body = json(result);
    assertEnvelope(body);
    assertThat(body.get("code").asInt()).isEqualTo(-1);
    assertThat(body.get("data").isNull()).isTrue();
  }

  @Test
  @Order(4)
  void unauthenticatedReturns401() throws Exception {
    MvcResult result = call(get("/api/users"), null);
    assertThat(result.getResponse().getStatus()).isEqualTo(401);
    assertEnvelope(json(result));
  }

  @Test
  @Order(5)
  void forbiddenReturns403() throws Exception {
    String userToken = login("zhangsan", ADMIN_PASSWORD);
    MvcResult result = call(get("/api/roles"), userToken);
    assertThat(result.getResponse().getStatus()).isEqualTo(403);
    assertEnvelope(json(result));
  }

  @Test
  @Order(6)
  void publicConfigNeedsNoAuth() throws Exception {
    MvcResult result = call(get("/api/public/config"), null);
    assertThat(result.getResponse().getStatus()).isEqualTo(200);
    JsonNode body = json(result);
    assertEnvelope(body);
    assertThat(body.get("code").asInt()).isZero();
  }

  // ------------------------------------------------------------ 资源形状

  @Test
  @Order(10)
  void loginShape() throws Exception {
    MvcResult result =
        call(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of("account", ADMIN_ACCOUNT, "password", ADMIN_PASSWORD))),
            null);
    JsonNode data = json(result).get("data");
    assertThat(fieldNames(data)).containsExactlyInAnyOrder("token", "user");
    JsonNode user = data.get("user");
    assertThat(fieldNames(user))
        .containsExactlyInAnyOrder("id", "name", "email", "avatar", "role", "permissions");
    assertThat(user.get("id").isTextual()).isTrue();
    assertThat(user.get("permissions").isArray()).isTrue();
  }

  @Test
  @Order(11)
  void userShapeAndPagination() throws Exception {
    MvcResult result = call(get("/api/users?page=1&pageSize=2"), adminToken());
    JsonNode data = json(result).get("data");
    assertThat(fieldNames(data)).containsExactlyInAnyOrder("list", "total", "page", "pageSize");
    assertThat(data.get("page").asInt()).isEqualTo(1);
    assertThat(data.get("pageSize").asInt()).isEqualTo(2);
    JsonNode first = data.get("list").get(0);
    assertThat(fieldNames(first))
        .containsExactlyInAnyOrder("id", "username", "name", "email", "roleId", "avatar");
    assertThat(first.get("id").isTextual()).isTrue();
  }

  @Test
  @Order(12)
  void paginationIsClampedNotRejected() throws Exception {
    MvcResult result = call(get("/api/users?page=0&pageSize=1000"), adminToken());
    assertThat(result.getResponse().getStatus()).isEqualTo(200);
    JsonNode data = json(result).get("data");
    assertThat(data.get("page").asInt()).isGreaterThanOrEqualTo(1);
    assertThat(data.get("pageSize").asInt()).isLessThanOrEqualTo(100);
  }

  @Test
  @Order(13)
  void roleShape() throws Exception {
    MvcResult result = call(get("/api/roles"), adminToken());
    JsonNode role = json(result).get("data").get("list").get(0);
    assertThat(fieldNames(role))
        .containsExactlyInAnyOrder("id", "name", "description", "permissions", "isPreset");
  }

  @Test
  @Order(14)
  void permissionShape() throws Exception {
    MvcResult result = call(get("/api/permissions"), adminToken());
    JsonNode first = json(result).get("data").get(0);
    assertThat(fieldNames(first)).containsExactlyInAnyOrder("code", "name", "type", "parent");
  }

  @Test
  @Order(16)
  void permissionsMatchCatalog() throws Exception {
    // 权限的唯一来源是 PermissionCatalog；启动同步据此补齐。
    // 这条断言让「目录改了但没生效」或「数据库残留已删除权限」立即暴露。
    MvcResult result = call(get("/api/permissions"), adminToken());
    Set<String> actual = new LinkedHashSet<>();
    json(result).get("data").forEach(item -> actual.add(item.get("code").asText()));

    Set<String> expected = new LinkedHashSet<>();
    PermissionCatalog.ALL_PERMISSIONS.forEach(item -> expected.add(item.code()));

    assertThat(actual)
        .as("多出: %s\n缺失: %s", minus(actual, expected), minus(expected, actual))
        .isEqualTo(expected);
  }

  @Test
  @Order(17)
  void adminHoldsEveryCatalogPermission() throws Exception {
    MvcResult result = call(get("/api/roles?pageSize=100"), adminToken());
    Set<String> adminPermissions = new LinkedHashSet<>();
    json(result)
        .get("data")
        .get("list")
        .forEach(
            role -> {
              if ("admin".equals(role.get("id").asText())) {
                role.get("permissions").forEach(p -> adminPermissions.add(p.asText()));
              }
            });

    Set<String> expected = new LinkedHashSet<>();
    PermissionCatalog.ALL_PERMISSIONS.forEach(item -> expected.add(item.code()));

    assertThat(adminPermissions).isEqualTo(expected);
  }

  @Test
  @Order(15)
  void menuConfigShape() throws Exception {
    MvcResult result = call(get("/api/menus"), adminToken());
    JsonNode data = json(result).get("data");
    assertThat(fieldNames(data)).containsExactlyInAnyOrder("version", "groups");
    JsonNode group = data.get("groups").get(0);
    assertThat(fieldNames(group))
        .containsExactlyInAnyOrder("id", "name", "sortOrder", "isSystem", "items");
    JsonNode item = group.get("items").get(0);
    assertThat(fieldNames(item))
        .containsExactlyInAnyOrder(
            "permissionCode",
            "name",
            "groupId",
            "route",
            "icon",
            "sortOrder",
            "isSystem",
            "hidden",
            "operations");
  }

  @Test
  @Order(16)
  void navigationShape() throws Exception {
    MvcResult result = call(get("/api/menus/navigation"), adminToken());
    JsonNode group = json(result).get("data").get(0);
    assertThat(fieldNames(group)).containsExactlyInAnyOrder("id", "name", "sortOrder", "items");
    JsonNode item = group.get("items").get(0);
    assertThat(fieldNames(item))
        .containsExactlyInAnyOrder("permissionCode", "name", "route", "icon", "sortOrder");
  }

  @Test
  @Order(17)
  void systemConfigShapeAndMaskedPassword() throws Exception {
    MvcResult result = call(get("/api/system/config"), adminToken());
    JsonNode data = json(result).get("data");
    assertThat(fieldNames(data))
        .containsExactlyInAnyOrder(
            "siteName",
            "siteDescription",
            "keywords",
            "maintenanceEnabled",
            "maintenanceMessage",
            "openRegistration",
            "manualReview",
            "defaultRoleId",
            "welcomeMessage",
            "smtpEnabled",
            "smtpHost",
            "smtpPort",
            "smtpUsername",
            "smtpPassword",
            "smtpFromName",
            "smtpFromEmail",
            "smtpUseSsl");
    assertThat(data.get("smtpPassword").asText()).isEqualTo("****");
  }

  @Test
  @Order(18)
  void publicConfigShape() throws Exception {
    MvcResult result = call(get("/api/public/config"), null);
    JsonNode data = json(result).get("data");
    assertThat(fieldNames(data))
        .containsExactlyInAnyOrder(
            "siteName",
            "siteDescription",
            "maintenanceEnabled",
            "maintenanceMessage",
            "openRegistration",
            "manualReview");
  }

  @Test
  @Order(19)
  void dashboardShape() throws Exception {
    JsonNode stats = json(call(get("/api/dashboard/stats"), adminToken())).get("data");
    assertThat(fieldNames(stats))
        .containsExactlyInAnyOrder("totalUsers", "activeNow", "revenue", "growth");
    JsonNode activity = json(call(get("/api/dashboard/activity"), adminToken())).get("data");
    assertThat(fieldNames(activity.get(0))).containsExactlyInAnyOrder("user", "action", "time");
  }

  @Test
  @Order(20)
  void aiModelShapes() throws Exception {
    JsonNode listing = json(call(get("/api/ai-models"), adminToken())).get("data");
    assertThat(fieldNames(listing)).containsExactlyInAnyOrder("list", "total", "page", "pageSize");

    JsonNode presets = json(call(get("/api/ai-models/presets"), adminToken())).get("data");
    assertThat(fieldNames(presets.get(0)))
        .containsExactlyInAnyOrder(
            "id", "group", "alias", "modelName", "apiUrl", "description", "isActive", "sortOrder");

    JsonNode groups = json(call(get("/api/ai-models/presets/groups"), adminToken())).get("data");
    assertThat(groups.isArray()).isTrue();
  }

  @Test
  @Order(21)
  void auditLogShape() throws Exception {
    MvcResult result = call(get("/api/audit-logs?pageSize=1"), adminToken());
    JsonNode data = json(result).get("data");
    assertThat(fieldNames(data)).containsExactlyInAnyOrder("list", "total", "page", "pageSize");
    if (data.get("list").size() > 0) {
      JsonNode log = data.get("list").get(0);
      assertThat(fieldNames(log))
          .containsExactlyInAnyOrder(
              "id", "userId", "username", "action", "ip", "status", "detail", "createdAt");
      assertThat(log.get("id").isTextual()).isTrue();
      assertThat(log.get("userId").isTextual()).isTrue();
    }
  }

  @Test
  @Order(22)
  void apiKeyIsMasked() throws Exception {
    String alias = unique("mask");
    MvcResult result =
        call(
            post("/api/ai-models")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of(
                            "alias", alias,
                            "modelName", "m",
                            "apiUrl", "https://api.example.com/v1",
                            "apiKey", "sk-1234567890abcdef"))),
            adminToken());
    JsonNode data = json(result).get("data");
    assertThat(fieldNames(data))
        .containsExactlyInAnyOrder(
            "id", "alias", "modelName", "apiUrl", "apiKey", "description", "isDefault");
    assertThat(data.get("apiKey").asText()).contains("****");
    assertThat(data.get("apiKey").asText()).doesNotContain("1234567890");
  }

  // ------------------------------------------------------------ 语义约束

  @Test
  @Order(30)
  void logoutInvalidatesToken() throws Exception {
    String own = login(ADMIN_ACCOUNT, ADMIN_PASSWORD);
    assertThat(call(get("/api/users"), own).getResponse().getStatus()).isEqualTo(200);

    MvcResult logout = call(post("/api/auth/logout"), own);
    assertThat(logout.getResponse().getStatus()).isEqualTo(200);

    assertThat(call(get("/api/users"), own).getResponse().getStatus())
        .as("登出后旧令牌仍然可用")
        .isEqualTo(401);
  }

  @Test
  @Order(31)
  void failedWriteLeavesNoRow() throws Exception {
    String alias = unique("dup");
    String payload =
        objectMapper.writeValueAsString(
            Map.of(
                "alias", alias,
                "modelName", "m",
                "apiUrl", "https://api.example.com/v1",
                "apiKey", "sk-1234567890abcdef"));

    MvcResult first =
        call(
            post("/api/ai-models").contentType(MediaType.APPLICATION_JSON).content(payload),
            adminToken());
    assertThat(json(first).get("code").asInt()).isZero();

    MvcResult duplicate =
        call(
            post("/api/ai-models").contentType(MediaType.APPLICATION_JSON).content(payload),
            adminToken());
    assertThat(json(duplicate).get("code").asInt()).isEqualTo(-1);

    JsonNode listing = json(call(get("/api/ai-models?search=" + alias), adminToken())).get("data");
    assertThat(listing.get("list")).hasSize(1);
  }

  @Test
  @Order(32)
  void menuPermissionMutationIsRejected() throws Exception {
    MvcResult result =
        call(
            post("/api/permissions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of("code", unique("menu"), "name", "x", "type", "menu"))),
            adminToken());
    assertThat(json(result).get("code").asInt()).isEqualTo(-1);
  }

  @Test
  @Order(33)
  void ssrfRejectsDomainResolvingToLoopback() throws Exception {
    MvcResult result =
        call(
            post("/api/ai-models")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of(
                            "alias", unique("ssrf"),
                            "modelName", "m",
                            "apiUrl", "http://127.0.0.1.nip.io/v1",
                            "apiKey", "sk-1234567890abcdef"))),
            adminToken());
    assertThat(json(result).get("code").asInt()).as("指向 127.0.0.1 的域名未被拦截").isEqualTo(-1);
  }

  @Test
  @Order(34)
  void exportIsZipWithPasswordHeader() throws Exception {
    MvcResult result = call(post("/api/data/export"), adminToken());
    assertThat(result.getResponse().getStatus()).isEqualTo(200);
    assertThat(result.getResponse().getContentType()).contains("application/zip");
    assertThat(result.getResponse().getHeader("X-Export-Password")).isNotBlank();
    byte[] body = result.getResponse().getContentAsByteArray();
    assertThat(body.length).isGreaterThan(2);
    assertThat(new String(new byte[] {body[0], body[1]})).isEqualTo("PK");
  }

  // ------------------------------------------------------------ 角色写操作

  @Test
  @Order(35)
  void roleCreateReturnsItsPermissions() throws Exception {
    // 角色写接口此前只做 GET 形状断言，返回更新前旧权限的问题因此没被发现。
    MvcResult result =
        call(
            post("/api/roles")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of(
                            "name", unique("角色"), "permissions", List.of("dashboard", "users")))),
            adminToken());
    JsonNode body = json(result);
    assertThat(body.get("code").asInt()).as(body.toString()).isZero();
    assertThat(texts(body.get("data").get("permissions"))).containsExactly("dashboard", "users");
  }

  @Test
  @Order(36)
  void roleUpdateReturnsNewPermissions() throws Exception {
    String roleId = createRole(List.of("dashboard", "users"));

    MvcResult result =
        call(
            put("/api/roles/" + roleId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(Map.of("permissions", List.of("settings")))),
            adminToken());
    JsonNode body = json(result);
    assertThat(body.get("code").asInt()).as(body.toString()).isZero();
    assertThat(texts(body.get("data").get("permissions"))).containsExactly("settings");

    JsonNode role = findRole(roleId);
    assertThat(texts(role.get("permissions"))).as("更新后的权限没有持久化").containsExactly("settings");
  }

  @Test
  @Order(37)
  void roleUpdateWithoutPermissionsKeepsThem() throws Exception {
    String roleId = createRole(List.of("dashboard"));

    MvcResult result =
        call(
            put("/api/roles/" + roleId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "改名后的角色"))),
            adminToken());
    JsonNode body = json(result);
    assertThat(body.get("code").asInt()).as(body.toString()).isZero();
    assertThat(texts(body.get("data").get("permissions"))).containsExactly("dashboard");
  }

  @Test
  @Order(38)
  void roleDeleteRemovesGrants() throws Exception {
    String roleId = createRole(List.of("dashboard", "users"));

    MvcResult result = call(delete("/api/roles/" + roleId), adminToken());
    assertThat(json(result).get("code").asInt()).isZero();
    assertThat(result.getResponse().getStatus()).isEqualTo(200);

    MvcResult listing = call(get("/api/roles?pageSize=100"), adminToken());
    json(listing)
        .get("data")
        .get("list")
        .forEach(role -> assertThat(role.get("id").asText()).isNotEqualTo(roleId));
  }

  @Test
  @Order(39)
  void roleDeleteHandsUsersToDefaultRole() throws Exception {
    // 删除角色前必须先把其下用户转交到默认角色，否则 users.role_id 会指向已删除的角色。
    String roleId = createRole(List.of("dashboard"));
    long userId = createUserWithRole(roleId);

    MvcResult result = call(delete("/api/roles/" + roleId), adminToken());
    assertThat(json(result).get("code").asInt())
        .as(result.getResponse().getContentAsString())
        .isZero();

    MvcResult user = call(get("/api/users/" + userId), adminToken());
    assertThat(json(user).get("data").get("roleId").asText())
        .as("删除角色后用户应转交到默认角色")
        .isEqualTo("user");
  }

  private long createUserWithRole(String roleId) throws Exception {
    String username = unique("handover");
    MvcResult created =
        call(
            post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of(
                            "username",
                            username,
                            "name",
                            "转交用户",
                            "email",
                            username + "@example.com",
                            "roleId",
                            roleId,
                            "password",
                            "123456"))),
            adminToken());
    JsonNode body = json(created);
    assertThat(body.get("code").asInt()).as(body.toString()).isZero();
    return body.get("data").get("id").asLong();
  }

  private String createRole(List<String> permissions) throws Exception {
    MvcResult created =
        call(
            post("/api/roles")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of("name", unique("角色"), "permissions", permissions))),
            adminToken());
    JsonNode body = json(created);
    assertThat(body.get("code").asInt()).as(body.toString()).isZero();
    return body.get("data").get("id").asText();
  }

  private JsonNode findRole(String roleId) throws Exception {
    MvcResult listing = call(get("/api/roles?pageSize=100"), adminToken());
    for (JsonNode role : json(listing).get("data").get("list")) {
      if (roleId.equals(role.get("id").asText())) {
        return role;
      }
    }
    throw new AssertionError("角色不存在: " + roleId);
  }

  private static List<String> texts(JsonNode array) {
    List<String> out = new ArrayList<>();
    array.forEach(item -> out.add(item.asText()));
    return out;
  }

  private static List<String> fieldNames(JsonNode node) {
    List<String> names = new ArrayList<>();
    node.fieldNames().forEachRemaining(names::add);
    return names;
  }

  /** 防止未使用告警：保留 set 语义的类型引用。 */
  @SuppressWarnings("unused")
  private static Set<String> endpointsCopy() {
    return new LinkedHashSet<>(CONTRACT_ENDPOINTS);
  }
}

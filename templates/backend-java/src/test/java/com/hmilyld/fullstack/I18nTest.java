package com.hmilyld.fullstack;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hmilyld.fullstack.common.i18n.LocaleContext;
import com.hmilyld.fullstack.common.i18n.LocaleResolver;
import com.hmilyld.fullstack.common.i18n.MessageResolver;
import com.hmilyld.fullstack.data.DataOperationState;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** Accept-Language 本地化测试，覆盖认证、授权、校验和业务错误。 */
@SpringBootTest
@AutoConfigureMockMvc
class I18nTest {

  private static final String ADMIN_ACCOUNT = "admin";
  private static final String ADMIN_PASSWORD = "123456";
  private static final String ENGLISH = "en";

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;
  @Autowired private MessageResolver messageResolver;
  @Autowired private DataOperationState operationState;

  private String token;

  @DynamicPropertySource
  static void datasource(DynamicPropertyRegistry registry) {
    String db = System.getProperty("java.io.tmpdir") + "/java-i18n-" + UUID.randomUUID() + ".db";
    registry.add("spring.datasource.url", () -> "jdbc:sqlite:" + db);
    registry.add("app.data.tmp-dir", () -> System.getProperty("java.io.tmpdir") + "/java-i18n-tmp");
    registry.add("app.rate-limit.max-attempts", () -> "10000");
  }

  @Test
  void localeResolverDefaultsToChineseAndAcceptsEnglish() {
    assertThat(LocaleResolver.resolve(null)).isEqualTo("zh-CN");
    assertThat(LocaleResolver.resolve("")).isEqualTo("zh-CN");
    assertThat(LocaleResolver.resolve("zh-CN")).isEqualTo("zh-CN");
    assertThat(LocaleResolver.resolve("zh-CN,zh;q=0.9,en;q=0.8")).isEqualTo("zh-CN");
    assertThat(LocaleResolver.resolve("en")).isEqualTo("en");
    assertThat(LocaleResolver.resolve("en-US,en;q=0.9")).isEqualTo("en");
    assertThat(LocaleResolver.resolve("fr-FR,en;q=0.7")).isEqualTo("en");
    assertThat(LocaleResolver.resolve("fr-FR")).isEqualTo("zh-CN");
    assertThat(LocaleResolver.resolve("en;q=0,zh-CN")).isEqualTo("zh-CN");
    assertThat(LocaleResolver.resolve("*")).isEqualTo("zh-CN");
  }

  @Test
  void catalogTranslatesStaticAndDynamicMessagesWithoutLeakingKeys() {
    LocaleContext.set("en");
    try {
      assertThat(messageResolver.localize("权限不足")).isEqualTo("Permission denied.");
      assertThat(messageResolver.localize("文件校验失败: manifest.json"))
          .isEqualTo("File checksum verification failed: manifest.json");
      assertThat(messageResolver.localize("数据行数不一致: users"))
          .isEqualTo("Row count mismatch in table: users");
      assertThat(messageResolver.localize("未收录的自定义文案")).isEqualTo("未收录的自定义文案");
    } finally {
      LocaleContext.clear();
    }
    assertThat(messageResolver.localize("权限不足")).isEqualTo("权限不足");
  }

  @Test
  void loginErrorIsEnglishWithHeader() throws Exception {
    MvcResult result = perform(loginRequest("admin", "wrong-password"), ENGLISH);
    assertThat(result.getResponse().getStatus()).isEqualTo(200);
    JsonNode body = json(result);
    assertThat(body.get("code").asInt()).isEqualTo(-1);
    assertThat(body.get("message").asText()).isEqualTo("Incorrect account or password.");
  }

  @Test
  void loginErrorDefaultsToChinese() throws Exception {
    MvcResult result = perform(loginRequest("admin", "wrong-password"), null);
    assertThat(result.getResponse().getStatus()).isEqualTo(200);
    JsonNode body = json(result);
    assertThat(body.get("code").asInt()).isEqualTo(-1);
    assertThat(body.get("message").asText()).isEqualTo("账号或密码错误");
  }

  @Test
  void validationErrorIsEnglishWithHeader() throws Exception {
    MvcResult result =
        perform(
            post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"), ENGLISH);
    assertThat(result.getResponse().getStatus()).isEqualTo(422);
    String message = json(result).get("message").asText();
    assertThat(message).contains("Account is required.").contains("Password is required.");
  }

  @Test
  void unauthorizedErrorIsEnglishWithHeader() throws Exception {
    MvcResult result = perform(get("/api/users"), ENGLISH);
    assertThat(result.getResponse().getStatus()).isEqualTo(401);
    assertThat(json(result).get("message").asText())
        .isEqualTo("You are not signed in or your session has expired.");
  }

  @Test
  void forbiddenErrorIsEnglishWithHeader() throws Exception {
    String limitedToken = registerLimitedUser();
    String username = "blocked" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    MvcResult result =
        perform(
            post("/api/users")
                .header("Authorization", "Bearer " + limitedToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of(
                            "username", username,
                            "name", "blocked",
                            "email", username + "@example.com",
                            "roleId", "user",
                            "password", "123456"))),
            ENGLISH);
    assertThat(result.getResponse().getStatus()).isEqualTo(403);
    assertThat(json(result).get("message").asText()).isEqualTo("Permission denied.");
  }

  @Test
  void businessErrorIsEnglishWithHeader() throws Exception {
    MvcResult result =
        perform(
            get("/api/users/999999").header("Authorization", "Bearer " + adminToken()), ENGLISH);
    assertThat(result.getResponse().getStatus()).isEqualTo(200);
    JsonNode body = json(result);
    assertThat(body.get("code").asInt()).isEqualTo(-1);
    assertThat(body.get("message").asText()).isEqualTo("User not found.");

    MvcResult chinese =
        perform(get("/api/users/999999").header("Authorization", "Bearer " + adminToken()), null);
    assertThat(json(chinese).get("message").asText()).isEqualTo("用户不存在");
  }

  @Test
  void illegalArgumentErrorIsEnglishWithHeader() throws Exception {
    MvcResult result =
        perform(
            post("/api/ai-models")
                .header("Authorization", "Bearer " + adminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of(
                            "alias", "i18n-check",
                            "modelName", "i18n-check",
                            "apiUrl", "http://169.254.169.254",
                            "apiKey", "test"))),
            ENGLISH);
    assertThat(result.getResponse().getStatus()).isEqualTo(200);
    assertThat(json(result).get("message").asText())
        .isEqualTo("Access to metadata endpoints is forbidden.");
  }

  @Test
  void freezeResponseFollowsAcceptLanguage() throws Exception {
    DataOperationState.ImportJob job = operationState.beginJob(1L);
    assertThat(job).isNotNull();
    try {
      MvcResult english = perform(get("/api/public/config"), ENGLISH);
      assertThat(english.getResponse().getStatus()).isEqualTo(503);
      assertThat(json(english).get("message").asText())
          .isEqualTo("Data import is in progress. Please try again later.");

      MvcResult chinese = perform(get("/api/public/config"), null);
      assertThat(chinese.getResponse().getStatus()).isEqualTo(503);
      assertThat(json(chinese).get("message").asText()).isEqualTo("系统正在导入数据，请稍后重试");
      assertThat(json(chinese).get("data").isNull()).isTrue();
    } finally {
      operationState.finishJob(job, "failed", "test cleanup");
    }
  }

  private MvcResult perform(MockHttpServletRequestBuilder builder, String language)
      throws Exception {
    if (language != null) {
      builder.header("Accept-Language", language);
    }
    return mockMvc.perform(builder).andReturn();
  }

  private MockHttpServletRequestBuilder loginRequest(String account, String password)
      throws Exception {
    return post("/api/auth/login")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(Map.of("account", account, "password", password)));
  }

  private JsonNode json(MvcResult result) throws Exception {
    return objectMapper.readTree(result.getResponse().getContentAsByteArray());
  }

  private String adminToken() throws Exception {
    if (token == null) {
      MvcResult result = perform(loginRequest(ADMIN_ACCOUNT, ADMIN_PASSWORD), null);
      token = json(result).get("data").get("token").asText();
    }
    return token;
  }

  private String registerLimitedUser() throws Exception {
    String username = "i18n" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    MvcResult result =
        perform(
            post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of(
                            "username",
                            username,
                            "email",
                            username + "@example.com",
                            "password",
                            "123456"))),
            null);
    JsonNode body = json(result);
    assertThat(body.get("code").asInt()).as(body.toString()).isZero();
    return body.get("data").get("token").asText();
  }
}

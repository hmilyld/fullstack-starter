package com.hmilyld.fullstack;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/** 开发环境三个前端端口的跨域配置：允许列表内的来源，拒绝其他来源。 */
@SpringBootTest
@AutoConfigureMockMvc
class CorsTest {

  @Autowired private MockMvc mockMvc;

  @DynamicPropertySource
  static void datasource(DynamicPropertyRegistry registry) {
    String db = System.getProperty("java.io.tmpdir") + "/java-cors-" + UUID.randomUUID() + ".db";
    registry.add("spring.datasource.url", () -> "jdbc:sqlite:" + db);
    registry.add("app.data.tmp-dir", () -> System.getProperty("java.io.tmpdir") + "/java-cors-tmp");
    registry.add("app.rate-limit.max-attempts", () -> "10000");
  }

  @Test
  void allowsEveryConfiguredFrontendOrigin() throws Exception {
    for (int port = 5173; port <= 5175; port++) {
      String origin = "http://localhost:" + port;
      MvcResult result =
          mockMvc.perform(get("/api/public/config").header("Origin", origin)).andReturn();
      assertThat(result.getResponse().getStatus()).as(origin).isEqualTo(200);
      assertThat(result.getResponse().getHeader("Access-Control-Allow-Origin"))
          .as(origin)
          .isEqualTo(origin);
    }
  }

  @Test
  void allowsPreflightFromConfiguredOrigin() throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                options("/api/auth/login")
                    .header("Origin", "http://127.0.0.1:5174")
                    .header("Access-Control-Request-Method", "POST")
                    .header("Access-Control-Request-Headers", "content-type"))
            .andReturn();
    assertThat(result.getResponse().getStatus()).isEqualTo(200);
    assertThat(result.getResponse().getHeader("Access-Control-Allow-Origin"))
        .isEqualTo("http://127.0.0.1:5174");
    assertThat(result.getResponse().getHeader("Access-Control-Allow-Credentials"))
        .isEqualTo("true");
  }

  @Test
  void rejectsUnknownOrigin() throws Exception {
    MvcResult result =
        mockMvc
            .perform(get("/api/public/config").header("Origin", "http://evil.example"))
            .andReturn();
    assertThat(result.getResponse().getStatus()).isEqualTo(403);
    assertThat(result.getResponse().getHeader("Access-Control-Allow-Origin")).isNull();
  }
}

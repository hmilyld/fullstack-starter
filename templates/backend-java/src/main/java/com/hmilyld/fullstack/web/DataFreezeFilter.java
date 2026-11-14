package com.hmilyld.fullstack.web;

import com.hmilyld.fullstack.common.i18n.MessageResolver;
import com.hmilyld.fullstack.data.DataOperationState;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class DataFreezeFilter extends OncePerRequestFilter {

  private static final Pattern IMPORT_STATUS_PATH = Pattern.compile("^/api/data/import/[^/]+$");

  @Autowired private DataOperationState state;
  @Autowired private MessageResolver messageResolver;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    if (state.isFrozen()
        && !"OPTIONS".equalsIgnoreCase(request.getMethod())
        && !IMPORT_STATUS_PATH.matcher(request.getRequestURI()).matches()) {
      response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
      response.setCharacterEncoding(StandardCharsets.UTF_8.name());
      response.setContentType(MediaType.APPLICATION_JSON_VALUE);
      String message = messageResolver.localize("系统正在导入数据，请稍后重试");
      response.getWriter().write("{\"code\":-1,\"message\":\"" + message + "\",\"data\":null}");
      return;
    }
    filterChain.doFilter(request, response);
  }
}

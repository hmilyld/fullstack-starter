package com.hmilyld.fullstack.web;

import com.hmilyld.fullstack.common.i18n.LocaleContext;
import com.hmilyld.fullstack.common.i18n.LocaleResolver;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 在请求进入时解析 {@code Accept-Language}，请求结束时清理 ThreadLocal。
 *
 * <p>必须排在 {@code DataFreezeFilter} 之前，让冻结期间的 503 也能按请求语言返回。
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AcceptLanguageFilter extends OncePerRequestFilter {

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    LocaleContext.set(LocaleResolver.resolve(request.getHeader("Accept-Language")));
    try {
      filterChain.doFilter(request, response);
    } finally {
      LocaleContext.clear();
    }
  }
}

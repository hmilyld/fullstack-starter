package com.hmilyld.fullstack.common.i18n;

import java.util.Locale;

/**
 * 从 {@code Accept-Language} 解析请求 locale。
 *
 * <p>{@code en*} 返回英文；缺失、未知或 {@code zh-*} 都回退到默认中文。 {@code q=0} 的条目视为不可接受。
 */
public final class LocaleResolver {

  private LocaleResolver() {}

  public static String resolve(String acceptLanguage) {
    if (acceptLanguage == null || acceptLanguage.isBlank()) {
      return LocaleContext.DEFAULT_LOCALE;
    }

    for (String item : acceptLanguage.split(",")) {
      String[] parts = item.split(";");
      String tag = parts[0].trim().toLowerCase(Locale.ROOT);
      if (tag.isEmpty() || "*".equals(tag)) {
        continue;
      }
      if (quality(parts) <= 0) {
        continue;
      }
      if (tag.startsWith("en")) {
        return LocaleContext.ENGLISH_LOCALE;
      }
      if (tag.startsWith("zh")) {
        return LocaleContext.DEFAULT_LOCALE;
      }
    }
    return LocaleContext.DEFAULT_LOCALE;
  }

  private static double quality(String[] parts) {
    for (int i = 1; i < parts.length; i++) {
      String param = parts[i].trim();
      int equals = param.indexOf('=');
      if (equals < 0 || !"q".equalsIgnoreCase(param.substring(0, equals).trim())) {
        continue;
      }
      try {
        return Double.parseDouble(param.substring(equals + 1).trim());
      } catch (NumberFormatException e) {
        return 0;
      }
    }
    return 1;
  }
}

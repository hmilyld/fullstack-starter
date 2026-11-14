package com.hmilyld.fullstack.common.i18n;

/**
 * 当前请求的 locale。
 *
 * <p>由 {@code web.AcceptLanguageFilter} 在请求进入时写入、请求结束时清除。 只影响返回给客户端的消息，不影响数据、审计和日志。
 */
public final class LocaleContext {

  public static final String DEFAULT_LOCALE = "zh-CN";
  public static final String ENGLISH_LOCALE = "en";

  private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

  private LocaleContext() {}

  public static void set(String locale) {
    CURRENT.set(locale);
  }

  public static String get() {
    String locale = CURRENT.get();
    return locale == null ? DEFAULT_LOCALE : locale;
  }

  public static void clear() {
    CURRENT.remove();
  }
}

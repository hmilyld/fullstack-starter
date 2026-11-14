package com.hmilyld.fullstack.common.i18n;

import org.springframework.stereotype.Component;

/**
 * 把准备返回给客户端的中文消息转换为当前请求的语言。
 *
 * <p>未收录的消息原样返回，因此漏翻只会保留中文，而不会暴露消息键。
 */
@Component
public class MessageResolver {

  public String localize(String message) {
    if (!LocaleContext.ENGLISH_LOCALE.equals(LocaleContext.get())) {
      return message;
    }
    return MessageCatalog.translateToEnglish(message);
  }
}

package com.hmilyld.fullstack.common;

/**
 * 业务失败：映射为 HTTP 200 + {@code code: -1}。
 *
 * <p>契约要求写操作失败必须整体回滚，因此业务代码一律抛异常， 不得「先写库再返回 error」。见 docs/contract/api.md。
 */
public class AppException extends RuntimeException {

  public AppException(String message) {
    super(message);
  }
}

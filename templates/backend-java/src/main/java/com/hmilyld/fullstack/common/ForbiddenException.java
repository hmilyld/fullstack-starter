package com.hmilyld.fullstack.common;

/** 无权限：映射为 HTTP 403。 */
public class ForbiddenException extends RuntimeException {

  public ForbiddenException() {
    super("权限不足");
  }

  public ForbiddenException(String message) {
    super(message);
  }
}

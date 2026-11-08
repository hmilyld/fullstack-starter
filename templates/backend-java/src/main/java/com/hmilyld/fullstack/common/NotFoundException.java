package com.hmilyld.fullstack.common;

/** 资源不存在。仍返回 HTTP 200，与既有契约一致。 */
public class NotFoundException extends AppException {

  public NotFoundException(String message) {
    super(message);
  }
}

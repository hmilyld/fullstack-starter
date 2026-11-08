package com.hmilyld.fullstack.common;

/** 唯一约束冲突（用户名、邮箱、别名等重复）。 */
public class ConflictException extends AppException {

  public ConflictException(String message) {
    super(message);
  }
}

package com.hmilyld.fullstack.common;

/** 当前状态不允许该操作，例如删除预设角色、删除内置菜单。 */
public class InvalidOperationException extends AppException {

  public InvalidOperationException(String message) {
    super(message);
  }
}

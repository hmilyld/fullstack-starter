package com.hmilyld.fullstack.common;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 统一响应信封。
 *
 * <p>契约要求 {@code data} 键**永远存在**（失败时为 {@code null}）， 因此这里显式覆盖全局的 {@code default-property-inclusion:
 * non_null}。
 */
@JsonInclude(JsonInclude.Include.ALWAYS)
public class ApiResponse<T> {
  private int code;
  private String message;
  private T data;

  public ApiResponse() {}

  public ApiResponse(int code, String message, T data) {
    this.code = code;
    this.message = message;
    this.data = data;
  }

  public static <T> ApiResponse<T> success() {
    return new ApiResponse<>(0, "success", null);
  }

  public static <T> ApiResponse<T> success(T data) {
    return new ApiResponse<>(0, "success", data);
  }

  public static <T> ApiResponse<T> error(String message) {
    return new ApiResponse<>(-1, message, null);
  }

  public int getCode() {
    return code;
  }

  public void setCode(int code) {
    this.code = code;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public T getData() {
    return data;
  }

  public void setData(T data) {
    this.data = data;
  }
}

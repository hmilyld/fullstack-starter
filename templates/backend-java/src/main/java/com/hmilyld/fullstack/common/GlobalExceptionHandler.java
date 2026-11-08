package com.hmilyld.fullstack.common;

import cn.dev33.satoken.exception.NotLoginException;
import cn.dev33.satoken.exception.NotPermissionException;
import cn.dev33.satoken.exception.NotRoleException;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常映射，与 Python 侧 {@code app/core/exceptions.py} 一一对应。
 *
 * <ul>
 *   <li>业务失败 → HTTP 200 + {@code code: -1}
 *   <li>未认证 → 401；无权限 → 403；参数校验 → 422
 *   <li>未处理异常 → 500，不泄露堆栈
 * </ul>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(NotLoginException.class)
  public ResponseEntity<ApiResponse<?>> handleNotLogin(NotLoginException e) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("未登录或登录已过期"));
  }

  @ExceptionHandler(NotPermissionException.class)
  public ResponseEntity<ApiResponse<?>> handleNotPermission(NotPermissionException e) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("权限不足"));
  }

  @ExceptionHandler(NotRoleException.class)
  public ResponseEntity<ApiResponse<?>> handleNotRole(NotRoleException e) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("角色权限不足"));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<?>> handleValidation(MethodArgumentNotValidException e) {
    String msg =
        e.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getDefaultMessage() != null ? f.getDefaultMessage() : f.getField())
            .collect(Collectors.joining("; "));
    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(ApiResponse.error(msg));
  }

  /** 业务失败：HTTP 200 + code -1，data 为 null。 */
  @ExceptionHandler(AppException.class)
  public ApiResponse<?> handleApp(AppException e) {
    return ApiResponse.error(e.getMessage());
  }

  /** 无权限：HTTP 403。 */
  @ExceptionHandler(ForbiddenException.class)
  public ResponseEntity<ApiResponse<?>> handleForbidden(ForbiddenException e) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ApiResponse<?> handleIllegalArgument(IllegalArgumentException e) {
    return ApiResponse.error(e.getMessage());
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<?>> handleException(Exception e) {
    log.error("Unhandled exception", e);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiResponse.error("服务器内部错误"));
  }
}

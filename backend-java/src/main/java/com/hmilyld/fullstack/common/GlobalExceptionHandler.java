package com.hmilyld.fullstack.common;

import cn.dev33.satoken.exception.NotLoginException;
import cn.dev33.satoken.exception.NotPermissionException;
import cn.dev33.satoken.exception.NotRoleException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotLoginException.class)
    public ApiResponse<?> handleNotLogin(NotLoginException e) {
        return ApiResponse.error("未登录或登录已过期");
    }

    @ExceptionHandler(NotPermissionException.class)
    public ApiResponse<?> handleNotPermission(NotPermissionException e) {
        return ApiResponse.error("权限不足");
    }

    @ExceptionHandler(NotRoleException.class)
    public ApiResponse<?> handleNotRole(NotRoleException e) {
        return ApiResponse.error("角色权限不足");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResponse<?> handleValidation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ApiResponse.error(msg);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ApiResponse<?> handleIllegalArgument(IllegalArgumentException e) {
        return ApiResponse.error(e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ApiResponse<?> handleException(Exception e) {
        return ApiResponse.error("服务器内部错误");
    }
}

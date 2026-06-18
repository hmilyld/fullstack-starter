package com.hmilyld.fullstack.service;

import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.common.PageResult;
import com.hmilyld.fullstack.dto.*;
import com.hmilyld.fullstack.entity.User;
import com.hmilyld.fullstack.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public ApiResponse<?> getUsers(String search, int page, int pageSize) {
        Page<User> userPage = userRepository.search(search,
                PageRequest.of(page - 1, pageSize, Sort.by("id").ascending()));

        PageResult<Map<String, Object>> result = new PageResult<>(
                userPage.getContent().stream().map(this::toOutMap).toList(),
                userPage.getTotalElements(),
                page,
                pageSize
        );
        return ApiResponse.success(result);
    }

    public ApiResponse<?> getUser(Long id) {
        return userRepository.findById(id)
                .map(user -> ApiResponse.success(toOutMap(user)))
                .orElse(ApiResponse.error("用户不存在"));
    }

    public ApiResponse<?> createUser(UserCreateRequest req) {
        if (userRepository.findByUsername(req.getUsername()).isPresent()) {
            return ApiResponse.error("用户名已存在");
        }
        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            return ApiResponse.error("邮箱已被注册");
        }

        User user = new User();
        user.setUsername(req.getUsername());
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setRoleId(req.getRoleId());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setAvatar("");
        userRepository.save(user);

        return ApiResponse.success(toOutMap(user));
    }

    public ApiResponse<?> updateUser(Long id, UserUpdateRequest req) {
        return userRepository.findById(id).map(user -> {
            if (req.getUsername() != null) user.setUsername(req.getUsername());
            if (req.getName() != null) user.setName(req.getName());
            if (req.getEmail() != null) user.setEmail(req.getEmail());
            if (req.getRoleId() != null) user.setRoleId(req.getRoleId());
            if (req.getAvatar() != null) user.setAvatar(req.getAvatar());
            userRepository.save(user);
            return ApiResponse.success(toOutMap(user));
        }).orElse(ApiResponse.error("用户不存在"));
    }

    public ApiResponse<?> deleteUser(Long id) {
        return userRepository.findById(id).map(user -> {
            userRepository.delete(user);
            return ApiResponse.success();
        }).orElse(ApiResponse.error("用户不存在"));
    }

    public ApiResponse<?> resetPassword(Long id, String newPassword) {
        return userRepository.findById(id).map(user -> {
            user.setPasswordHash(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            return ApiResponse.success();
        }).orElse(ApiResponse.error("用户不存在"));
    }

    public ApiResponse<?> batchUpdateRole(BatchRoleUpdateRequest req, Long currentUserId) {
        for (Long userId : req.getUserIds()) {
            userRepository.findById(userId).ifPresent(user -> {
                if (!"admin".equals(user.getRoleId()) || currentUserId != null) {
                    user.setRoleId(req.getRoleId());
                    userRepository.save(user);
                }
            });
        }
        return ApiResponse.success();
    }

    public ApiResponse<?> updateMe(Long userId, UpdateMeRequest req) {
        return userRepository.findById(userId).map(user -> {
            if (req.getEmail() != null && !req.getEmail().equals(user.getEmail())) {
                if (userRepository.findByEmail(req.getEmail()).isPresent()) {
                    return ApiResponse.<Object>error("邮箱已被注册");
                }
                user.setEmail(req.getEmail());
            }
            if (req.getName() != null) user.setName(req.getName());
            userRepository.save(user);
            return ApiResponse.success(toOutMap(user));
        }).orElse(ApiResponse.error("用户不存在"));
    }

    public ApiResponse<?> changePassword(Long userId, ChangePasswordRequest req) {
        return userRepository.findById(userId).map(user -> {
            if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
                return ApiResponse.<Object>error("当前密码错误");
            }
            user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
            userRepository.save(user);
            return ApiResponse.success();
        }).orElse(ApiResponse.error("用户不存在"));
    }

    private Map<String, Object> toOutMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", String.valueOf(user.getId()));
        map.put("username", user.getUsername());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("roleId", user.getRoleId());
        map.put("avatar", user.getAvatar() != null ? user.getAvatar() : "");
        return map;
    }
}

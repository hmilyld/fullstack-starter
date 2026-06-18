package com.hmilyld.fullstack.service;

import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DashboardService {

    @Autowired
    private UserRepository userRepository;

    public ApiResponse<?> getStats() {
        long totalUsers = userRepository.count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("activeNow", new Random().nextInt(91) + 10);
        stats.put("revenue", String.format("¥%,d", new Random().nextInt(90001) + 10000));
        stats.put("growth", String.format("+%d%%", new Random().nextInt(26) + 5));
        return ApiResponse.success(stats);
    }

    public ApiResponse<?> getActivity() {
        List<Map<String, String>> activity = List.of(
                Map.of("user", "张三", "action", "创建了新项目", "time", "2 分钟前"),
                Map.of("user", "李四", "action", "更新了账户设置", "time", "15 分钟前"),
                Map.of("user", "王五", "action", "上传了 3 个文件", "time", "1 小时前"),
                Map.of("user", "赵六", "action", "发表了评论", "time", "2 小时前"),
                Map.of("user", "孙七", "action", "完成了新手引导", "time", "5 小时前")
        );
        return ApiResponse.success(activity);
    }
}

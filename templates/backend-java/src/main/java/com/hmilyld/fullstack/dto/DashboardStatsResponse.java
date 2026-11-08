package com.hmilyld.fullstack.dto;

import java.util.List;

/** 仪表盘统计。 */
public record DashboardStatsResponse(
    long totalUsers, int activeNow, String revenue, String growth) {

  /** 近期活动项。 */
  public record ActivityItemResponse(String user, String action, String time) {}

  /** 便捷构造：活动列表。 */
  public static List<ActivityItemResponse> sampleActivity() {
    return List.of(
        new ActivityItemResponse("张三", "创建了新项目", "2 分钟前"),
        new ActivityItemResponse("李四", "更新了账户设置", "15 分钟前"),
        new ActivityItemResponse("王五", "上传了 3 个文件", "1 小时前"),
        new ActivityItemResponse("赵六", "发表了评论", "2 小时前"),
        new ActivityItemResponse("孙七", "完成了新手引导", "5 小时前"));
  }
}

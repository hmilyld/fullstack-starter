package com.hmilyld.fullstack.service;

import com.hmilyld.fullstack.common.ApiResponse;
import com.hmilyld.fullstack.dto.DashboardStatsResponse;
import com.hmilyld.fullstack.repository.UserRepository;
import java.util.List;
import java.util.Random;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/** 仪表盘领域。三项指标是脚手架占位数据，接入真实业务后替换为实际查询。 */
@Service
public class DashboardService {

  @Autowired private UserRepository userRepository;

  public ApiResponse<DashboardStatsResponse> getStats() {
    Random random = new Random();
    return ApiResponse.success(
        new DashboardStatsResponse(
            userRepository.count(),
            random.nextInt(91) + 10,
            String.format("¥%,d", random.nextInt(90001) + 10000),
            String.format("+%d%%", random.nextInt(26) + 5)));
  }

  public ApiResponse<List<DashboardStatsResponse.ActivityItemResponse>> getActivity() {
    return ApiResponse.success(DashboardStatsResponse.sampleActivity());
  }
}

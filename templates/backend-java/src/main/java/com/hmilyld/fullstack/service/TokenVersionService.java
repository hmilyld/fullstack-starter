package com.hmilyld.fullstack.service;

import cn.dev33.satoken.stp.StpUtil;
import com.hmilyld.fullstack.entity.User;
import org.springframework.stereotype.Service;

/**
 * 令牌吊销。
 *
 * <p>Sa-Token 的会话保存在服务端，{@code StpUtil.logout(userId)} 会踢掉该用户的全部会话， 与 Python 侧 {@code
 * users.token_version} 递增的语义一致： 登出、改密、管理员重置密码后，既有令牌立即失效。
 */
@Service
public class TokenVersionService {

  /** 吊销该用户的所有会话。 */
  public void revokeSessions(User user) {
    if (user == null || user.getId() == null) return;
    StpUtil.logout(user.getId());
  }
}

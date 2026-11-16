package com.hmilyld.fullstack.common.i18n;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 客户端可见消息的英文目录。
 *
 * <p>键是业务代码当前抛出的中文原文；值是对应的英文文案。动态消息用正则捕获参数， 模板以 {@code {0}}、{@code {1}} 占位。未收录的消息原样返回，
 * 绝不把目录键暴露给客户端。注释、审计 detail、目录数据和日志不经过这里。
 */
final class MessageCatalog {

  private MessageCatalog() {}

  private record PatternMessage(Pattern pattern, String template) {}

  private static final Map<String, String> MESSAGES =
      Map.ofEntries(
          // 认证 / 授权
          Map.entry("未登录或登录已过期", "You are not signed in or your session has expired."),
          Map.entry("权限不足", "Permission denied."),
          Map.entry("角色权限不足", "Insufficient role permission."),
          Map.entry("登录状态已失效，请重新登录", "Your session has expired. Please sign in again."),
          // 通用错误
          Map.entry("服务器内部错误", "Internal server error."),
          Map.entry("系统正在导入数据，请稍后重试", "Data import is in progress. Please try again later."),
          Map.entry("数据操作正在进行，请稍后重试", "A data operation is in progress. Please try again later."),
          // 登录 / 注册
          Map.entry("登录尝试过于频繁，请稍后再试", "Too many login attempts. Please try again later."),
          Map.entry("注册尝试过于频繁，请稍后再试", "Too many registration attempts. Please try again later."),
          Map.entry("账号或密码错误", "Incorrect account or password."),
          Map.entry(
              "账号正在审核中，请等待管理员批准",
              "Your account is under review. Please wait for administrator approval."),
          Map.entry("系统维护中", "The system is under maintenance."),
          Map.entry("注册已关闭", "Registration is closed."),
          Map.entry("用户名已存在", "Username already exists."),
          Map.entry("邮箱已被注册", "Email is already registered."),
          // 用户
          Map.entry("用户不存在", "User not found."),
          Map.entry("不能降级自己的管理员角色", "You cannot downgrade your own administrator role."),
          Map.entry("不能修改自己的角色", "You cannot change your own role."),
          Map.entry("不能删除自己", "You cannot delete yourself."),
          Map.entry("不能删除最后一个管理员", "You cannot delete the last administrator."),
          Map.entry("当前密码错误", "Current password is incorrect."),
          // 角色
          Map.entry("角色不存在", "Role not found."),
          Map.entry("预设角色不可删除", "Preset roles cannot be deleted."),
          Map.entry(
              "找不到可用的默认角色，请先在系统设置中配置默认角色",
              "No available default role. Configure a default role in system settings first."),
          // 权限 / 菜单
          Map.entry("权限不存在", "Permission not found."),
          Map.entry("所属菜单不存在", "Parent menu not found."),
          Map.entry("请通过菜单管理创建菜单", "Create menus through menu management."),
          Map.entry("权限编码已存在", "Permission code already exists."),
          Map.entry("请通过菜单管理编辑菜单", "Edit menus through menu management."),
          Map.entry("请通过菜单管理删除菜单", "Delete menus through menu management."),
          Map.entry("菜单分组不存在", "Menu group not found."),
          Map.entry("菜单不存在", "Menu not found."),
          Map.entry("内置分组不能删除", "Built-in groups cannot be deleted."),
          Map.entry("请先移动或删除该分组下的菜单", "Move or delete the menus in this group first."),
          Map.entry("内置菜单不能删除", "Built-in menus cannot be deleted."),
          Map.entry(
              "菜单顺序已被其他管理员修改，请刷新后重试",
              "Menu order was changed by another administrator. Refresh and try again."),
          Map.entry("菜单布局包含重复或无效菜单", "Menu layout contains duplicate or invalid menus."),
          Map.entry("菜单布局必须包含全部菜单", "Menu layout must include every menu."),
          // AI 模型
          Map.entry("模型不存在", "Model not found."),
          Map.entry("未配置默认模型", "No default model is configured."),
          Map.entry("别名已存在", "Alias already exists."),
          Map.entry("预设模型不存在", "Preset model not found."),
          Map.entry("预设模型别名已存在", "Preset model alias already exists."),
          Map.entry("API地址、API Key 和模型名称不能为空", "API URL, API key and model name are required."),
          Map.entry("API 地址不能为空", "API URL is required."),
          Map.entry("API地址不能为空", "API URL is required."),
          Map.entry("API 地址格式无效", "Invalid API URL format."),
          Map.entry("API 地址必须使用 http 或 https 协议", "API URL must use http or https."),
          Map.entry("禁止访问内网地址", "Access to private network addresses is forbidden."),
          Map.entry("禁止访问该地址", "Access to this address is forbidden."),
          Map.entry("禁止访问元数据端点", "Access to metadata endpoints is forbidden."),
          Map.entry(
              "别名只能包含字母、数字、下划线和连字符",
              "Alias may only contain letters, digits, underscores and hyphens."),
          // 系统设置 / 邮件
          Map.entry("邮件服务未启用，请先开启SMTP配置", "Email service is disabled. Enable SMTP first."),
          Map.entry("SMTP服务器配置不完整", "SMTP server configuration is incomplete."),
          Map.entry("SMTP用户名或密码未配置", "SMTP username or password is not configured."),
          Map.entry(
              "SMTP认证失败，请检查用户名和密码", "SMTP authentication failed. Check the username and password."),
          Map.entry(
              "无法连接到SMTP服务器，请检查服务器地址和端口",
              "Cannot connect to the SMTP server. Check the server address and port."),
          Map.entry("邮件发送失败: 未知错误", "Failed to send email: unknown error."),
          Map.entry("测试邮件发送成功", "Test email sent successfully."),
          // 数据管理
          Map.entry("导入文件超过允许大小", "The import file exceeds the allowed size."),
          Map.entry("导入任务不存在", "Import job not found."),
          Map.entry("压缩包密码错误或文件损坏", "Incorrect archive password or corrupted file."),
          Map.entry("导入包中缺少有效管理员账号", "The import archive contains no valid administrator account."),
          Map.entry("导出格式版本不兼容", "Incompatible export format version."),
          Map.entry("数据库结构版本不兼容", "Incompatible database schema version."),
          Map.entry("应用版本不兼容", "Incompatible application version."),
          Map.entry(
              "导出文件来自其他后端实现", "The export was created by a different backend implementation."),
          Map.entry("数据表清单不完整", "The table list is incomplete."),
          Map.entry("校验和文件不完整", "The checksum file is incomplete."),
          Map.entry("压缩包包含重复文件", "The archive contains duplicate files."),
          Map.entry("压缩包结构不完整或包含未知文件", "The archive is incomplete or contains unknown files."),
          Map.entry("压缩包解压后超过允许大小", "The extracted archive exceeds the allowed size."),
          // 参数校验
          Map.entry("账号不能为空", "Account is required."),
          Map.entry("密码不能为空", "Password is required."),
          Map.entry("用户名不能为空", "Username is required."),
          Map.entry("姓名不能为空", "Name is required."),
          Map.entry("邮箱不能为空", "Email is required."),
          Map.entry("邮箱格式不正确", "Invalid email format."),
          Map.entry("角色不能为空", "Role is required."),
          Map.entry("角色ID不能为空", "Role ID is required."),
          Map.entry("密码长度不能少于6位", "Password must be at least 6 characters."),
          Map.entry("当前密码不能为空", "Current password is required."),
          Map.entry("新密码不能为空", "New password is required."),
          Map.entry("用户列表不能为空", "User list cannot be empty."),
          Map.entry("路由必须以单个 / 开头", "Route must start with a single /."),
          Map.entry("默认语言必须是 zh-CN 或 en", "Default language must be zh-CN or en."),
          Map.entry("别名不能为空", "Alias is required."),
          Map.entry("模型名称不能为空", "Model name is required."),
          Map.entry("API密钥不能为空", "API key is required."),
          Map.entry("角色名称不能为空", "Role name is required."),
          Map.entry("权限编码不能为空", "Permission code is required."),
          Map.entry("权限名称不能为空", "Permission name is required."),
          Map.entry("权限类型不能为空", "Permission type is required."),
          Map.entry("分组不能为空", "Group is required."));

  private static final List<PatternMessage> PATTERNS =
      List.of(
          new PatternMessage(Pattern.compile("^邮件发送失败: (.+)$"), "Failed to send email: {0}"),
          new PatternMessage(
              Pattern.compile("^禁止访问内网地址（(.+) 解析为 (.+)）$"),
              "Access to private network addresses is forbidden ({0} resolves to {1})"),
          new PatternMessage(
              Pattern.compile("^文件校验失败: (.+)$"), "File checksum verification failed: {0}"),
          new PatternMessage(Pattern.compile("^数据表结构不一致: (.+)$"), "Table schema mismatch: {0}"),
          new PatternMessage(
              Pattern.compile("^数据表列名非法: (.+)$"), "Invalid column name in table: {0}"),
          new PatternMessage(
              Pattern.compile("^数据字段不一致: (.+)$"), "Data field mismatch in table: {0}"),
          new PatternMessage(
              Pattern.compile("^数据行数不一致: (.+)$"), "Row count mismatch in table: {0}"));

  static String translateToEnglish(String message) {
    if (message == null || message.isEmpty()) {
      return message;
    }
    String exact = MESSAGES.get(message);
    if (exact != null) {
      return exact;
    }
    for (PatternMessage entry : PATTERNS) {
      Matcher matcher = entry.pattern().matcher(message);
      if (matcher.matches()) {
        return render(entry.template(), matcher);
      }
    }
    return message;
  }

  private static String render(String template, Matcher matcher) {
    String result = template;
    for (int i = 1; i <= matcher.groupCount(); i++) {
      String value = matcher.group(i);
      result = result.replace("{" + (i - 1) + "}", value == null ? "" : value);
    }
    return result;
  }
}

"""客户端可见消息的本地化。

请求头 ``Accept-Language`` 决定响应信封 ``message`` 的语言：``en*`` 返回英文，
其余情况（缺失、未知、``zh-*``）保持默认中文。只翻译真正发给客户端的错误
与提示文案；注释、审计 action/detail、菜单/角色/权限等目录数据、种子数据和
内部日志都不经过这里。
"""

import re

from fastapi import Request

DEFAULT_LOCALE = "zh-CN"
ENGLISH_LOCALE = "en"


def resolve_locale(accept_language: str | None) -> str:
    """从 ``Accept-Language`` 解析出支持的 locale。

    只认 ``en`` 与 ``zh`` 两个语言族；``q=0`` 的条目视为不可接受。
    任何无法识别或缺失的值都回退到默认的 zh-CN。
    """
    if not accept_language:
        return DEFAULT_LOCALE

    for item in accept_language.split(","):
        tag, _, params = item.partition(";")
        tag = tag.strip().lower()
        if not tag or tag == "*":
            continue
        if _quality(params) <= 0:
            continue
        if tag.startswith("en"):
            return ENGLISH_LOCALE
        if tag.startswith("zh"):
            return DEFAULT_LOCALE
    return DEFAULT_LOCALE


def _quality(params: str) -> float:
    for param in params.split(";"):
        key, _, value = param.partition("=")
        if key.strip().lower() == "q":
            try:
                return float(value)
            except ValueError:
                return 0.0
    return 1.0


def locale_from_request(request: Request) -> str:
    return resolve_locale(request.headers.get("accept-language"))


def localize_message(message: str, request: Request) -> str:
    """按请求语言翻译一条要返回给客户端的消息。"""
    return translate(message, locale_from_request(request))


def translate(message: str, locale: str) -> str:
    """把中文消息翻译成英文；未收录的消息原样返回，绝不暴露消息 key。"""
    if locale != ENGLISH_LOCALE:
        return message

    exact = _EN_MESSAGES.get(message)
    if exact is not None:
        return exact

    for pattern, template in _EN_PATTERNS:
        match = pattern.fullmatch(message)
        if match is not None:
            return template.format(*match.groups())
    return message


# 静态消息：中文原文 → 英文。原文就是业务代码当前抛出的文案。
_EN_MESSAGES: dict[str, str] = {
    # 认证 / 授权
    "未登录或登录已过期": "You are not signed in or your session has expired.",
    "权限不足": "Permission denied.",
    "角色权限不足": "Insufficient role permission.",
    "未提供认证凭据": "Authentication credentials were not provided.",
    "无效的token": "Invalid token.",
    "登录状态已失效，请重新登录": "Your session has expired. Please sign in again.",
    "用户不存在": "User not found.",
    # 通用错误
    "请求参数校验失败": "Request validation failed.",
    "服务器内部错误": "Internal server error.",
    "系统正在导入数据，请稍后重试": "Data import is in progress. Please try again later.",
    "数据操作正在进行，请稍后重试": "A data operation is in progress. Please try again later.",
    # 登录 / 注册
    "登录尝试过于频繁，请稍后再试": "Too many login attempts. Please try again later.",
    "注册尝试过于频繁，请稍后再试": "Too many registration attempts. Please try again later.",
    "账号或密码错误": "Incorrect account or password.",
    "账号正在审核中，请等待管理员批准": (
        "Your account is under review. Please wait for administrator approval."
    ),
    "系统维护中": "The system is under maintenance.",
    "注册已关闭": "Registration is closed.",
    "用户名已存在": "Username already exists.",
    "邮箱已被注册": "Email is already registered.",
    # 用户
    "不能降级自己的管理员角色": "You cannot downgrade your own administrator role.",
    "不能修改自己的角色": "You cannot change your own role.",
    "不能删除自己": "You cannot delete yourself.",
    "不能删除最后一个管理员": "You cannot delete the last administrator.",
    "当前密码错误": "Current password is incorrect.",
    # 角色
    "角色不存在": "Role not found.",
    "预设角色不可删除": "Preset roles cannot be deleted.",
    "找不到可用的默认角色，请先在系统设置中配置默认角色": (
        "No available default role. Configure a default role in system settings first."
    ),
    # 权限
    "权限不存在": "Permission not found.",
    "所属菜单不存在": "Parent menu not found.",
    "请通过菜单管理创建菜单": "Create menus through menu management.",
    "权限编码已存在": "Permission code already exists.",
    "请通过菜单管理编辑菜单": "Edit menus through menu management.",
    "请通过菜单管理删除菜单": "Delete menus through menu management.",
    # 菜单
    "菜单分组不存在": "Menu group not found.",
    "菜单不存在": "Menu not found.",
    "内置分组不能删除": "Built-in groups cannot be deleted.",
    "请先移动或删除该分组下的菜单": "Move or delete the menus in this group first.",
    "内置菜单不能删除": "Built-in menus cannot be deleted.",
    "菜单顺序已被其他管理员修改，请刷新后重试": (
        "Menu order was changed by another administrator. Refresh and try again."
    ),
    "菜单布局包含重复或无效菜单": "Menu layout contains duplicate or invalid menus.",
    "菜单布局必须包含全部菜单": "Menu layout must include every menu.",
    # AI 模型
    "模型不存在": "Model not found.",
    "未配置默认模型": "No default model is configured.",
    "别名已存在": "Alias already exists.",
    "预设模型不存在": "Preset model not found.",
    "预设模型别名已存在": "Preset model alias already exists.",
    "API地址、API Key 和模型名称不能为空": (
        "API URL, API key and model name are required."
    ),
    "API 地址不能为空": "API URL is required.",
    "API 地址格式无效": "Invalid API URL format.",
    "API 地址必须使用 https 或 http 协议": "API URL must use http or https.",
    "禁止访问内网地址": "Access to private network addresses is forbidden.",
    "禁止访问该地址": "Access to this address is forbidden.",
    "禁止访问元数据端点": "Access to metadata endpoints is forbidden.",
    "别名只能包含字母、数字、下划线和连字符": (
        "Alias may only contain letters, digits, underscores and hyphens."
    ),
    # 系统设置 / 邮件
    "邮件服务未启用，请先开启SMTP配置": "Email service is disabled. Enable SMTP first.",
    "SMTP服务器配置不完整": "SMTP server configuration is incomplete.",
    "SMTP用户名或密码未配置": "SMTP username or password is not configured.",
    "SMTP认证失败，请检查用户名和密码": (
        "SMTP authentication failed. Check the username and password."
    ),
    "无法连接到SMTP服务器，请检查服务器地址和端口": (
        "Cannot connect to the SMTP server. Check the server address and port."
    ),
    "SMTP连接超时，请检查网络或服务器配置": (
        "SMTP connection timed out. Check the network or server configuration."
    ),
    # 成功提示
    "注册成功，请等待管理员审核": (
        "Registration successful. Please wait for administrator approval."
    ),
    "权限同步完成": "Permissions synchronized.",
    "测试邮件发送成功": "Test email sent successfully.",
    # 数据管理
    "导入任务已创建": "Import job created.",
    "导入文件超过允许大小": "The import file exceeds the allowed size.",
    "导入任务不存在": "Import job not found.",
    "压缩包包含重复文件": "The archive contains duplicate files.",
    "压缩包结构不完整或包含未知文件": "The archive is incomplete or contains unknown files.",
    "压缩包包含非法路径": "The archive contains an invalid path.",
    "压缩包解压后超过允许大小": "The extracted archive exceeds the allowed size.",
    "导出格式版本不兼容": "Incompatible export format version.",
    "数据库结构版本不兼容": "Incompatible database schema version.",
    "应用版本不兼容": "Incompatible application version.",
    "导出文件来自其他后端实现": "The export was created by a different backend implementation.",
    "校验和文件不完整": "The checksum file is incomplete.",
    "数据表清单不完整": "The table list is incomplete.",
    "压缩包密码错误": "Incorrect archive password.",
    "压缩包内容无效": "Invalid archive content.",
    "导入包中缺少有效管理员账号": "The import archive contains no valid administrator account.",
}

# 动态消息：正则捕获参数，模板用 {0}、{1} 占位。
_EN_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"不允许更新用户字段: (.+)"), "Field cannot be updated: {0}"),
    (re.compile(r"邮件发送失败: (.+)"), "Failed to send email: {0}"),
    (re.compile(r"发送测试邮件时出错: (.+)"), "Error while sending the test email: {0}"),
    (
        re.compile(r"禁止访问内网地址（(.+) 解析为 (.+)）"),
        "Access to private network addresses is forbidden ({0} resolves to {1})",
    ),
    (re.compile(r"文件校验失败: (.+)"), "File checksum verification failed: {0}"),
    (re.compile(r"数据表结构不一致: (.+)"), "Table schema mismatch: {0}"),
    (re.compile(r"数据表列名非法: (.+)"), "Invalid column name in table: {0}"),
    (re.compile(r"数据字段不一致: (.+)"), "Data field mismatch in table: {0}"),
    (re.compile(r"数据行数不一致: (.+)"), "Row count mismatch in table: {0}"),
]

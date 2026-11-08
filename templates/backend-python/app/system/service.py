"""系统设置领域：配置读写与测试邮件。"""

import smtplib
from email.mime.text import MIMEText

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, InvalidOperationError
from app.system.models import SystemConfig
from app.system.schemas import PublicConfigOut, SystemConfigOut, SystemConfigUpdate

CONFIG_ID = 1
SMTP_TIMEOUT_SECONDS = 10

_FIELD_MAPPING = {
    "siteName": "site_name",
    "siteDescription": "site_description",
    "keywords": "keywords",
    "maintenanceEnabled": "maintenance_enabled",
    "maintenanceMessage": "maintenance_message",
    "openRegistration": "open_registration",
    "manualReview": "manual_review",
    "defaultRoleId": "default_role_id",
    "welcomeMessage": "welcome_message",
    "smtpEnabled": "smtp_enabled",
    "smtpHost": "smtp_host",
    "smtpPort": "smtp_port",
    "smtpUsername": "smtp_username",
    "smtpPassword": "smtp_password",
    "smtpFromName": "smtp_from_name",
    "smtpFromEmail": "smtp_from_email",
    "smtpUseSsl": "smtp_use_ssl",
}


async def get_config(db: AsyncSession) -> SystemConfig:
    config = (
        await db.execute(select(SystemConfig).where(SystemConfig.id == CONFIG_ID))
    ).scalar_one_or_none()
    if config is None:
        config = SystemConfig(id=CONFIG_ID)
        db.add(config)
        await db.flush()
    return config


def to_out(config: SystemConfig) -> SystemConfigOut:
    return SystemConfigOut.from_orm_config(config)


async def get_config_out(db: AsyncSession) -> SystemConfigOut:
    return to_out(await get_config(db))


async def update_config(db: AsyncSession, data: SystemConfigUpdate) -> SystemConfigOut:
    config = await get_config(db)
    for key, value in data.model_dump(exclude_unset=True).items():
        if value is None:
            continue
        # 脱敏掩码（"****"）不允许写回，避免覆盖真实 SMTP 密码；空字符串 "" 表示清除密码
        if key == "smtpPassword" and isinstance(value, str) and "*" in value:
            continue
        setattr(config, _FIELD_MAPPING.get(key, key), value)
    await db.flush()
    return to_out(config)


def public_out(config: SystemConfig) -> PublicConfigOut:
    return PublicConfigOut(
        siteName=config.site_name,
        siteDescription=config.site_description,
        maintenanceEnabled=bool(config.maintenance_enabled),
        maintenanceMessage=config.maintenance_message,
        openRegistration=bool(config.open_registration),
        manualReview=bool(config.manual_review),
    )


async def send_test_email(db: AsyncSession, email: str) -> None:
    config = await get_config(db)

    if not config.smtp_enabled:
        raise InvalidOperationError("邮件服务未启用，请先开启SMTP配置")
    if not config.smtp_host or not config.smtp_port:
        raise InvalidOperationError("SMTP服务器配置不完整")
    if not config.smtp_username or not config.smtp_password:
        raise InvalidOperationError("SMTP用户名或密码未配置")

    message = MIMEText("这是一封测试邮件，说明您的邮件配置已成功生效。", "plain", "utf-8")
    message["Subject"] = "测试邮件 - 管理系统"
    message["From"] = f"{config.smtp_from_name} <{config.smtp_from_email}>"
    message["To"] = email

    try:
        if config.smtp_use_ssl:
            server = smtplib.SMTP_SSL(config.smtp_host, config.smtp_port, timeout=SMTP_TIMEOUT_SECONDS)
        else:
            server = smtplib.SMTP(config.smtp_host, config.smtp_port, timeout=SMTP_TIMEOUT_SECONDS)
            server.starttls()
        try:
            server.login(config.smtp_username, config.smtp_password)
            server.sendmail(config.smtp_from_email, [email], message.as_string())
        finally:
            server.quit()
    except smtplib.SMTPAuthenticationError as exc:
        raise AppError("SMTP认证失败，请检查用户名和密码") from exc
    except smtplib.SMTPConnectError as exc:
        raise AppError("无法连接到SMTP服务器，请检查服务器地址和端口") from exc
    except TimeoutError as exc:
        raise AppError("SMTP连接超时，请检查网络或服务器配置") from exc
    except smtplib.SMTPException as exc:
        raise AppError(f"邮件发送失败: {exc}") from exc
    except OSError as exc:
        raise AppError(f"发送测试邮件时出错: {exc}") from exc

import smtplib
from email.mime.text import MIMEText

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import User
from app.core.schemas import ApiResponse, SystemConfigOut, SystemConfigUpdate
from app.database import get_db
from app.deps import require_permission
from app.modules.system import crud

router = APIRouter(prefix="/system", tags=["系统设置"])


@router.get("/config")
async def get_system_config(
    current_user: User = Depends(require_permission("settings")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    config = await crud.get_config(db)
    return ApiResponse(data=SystemConfigOut.from_orm_config(config).model_dump())


@router.put("/config")
async def update_system_config(
    data: SystemConfigUpdate,
    current_user: User = Depends(require_permission("settings.edit")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    update_data = data.model_dump(exclude_unset=True)
    config = await crud.update_config(db, **update_data)
    return ApiResponse(data=SystemConfigOut.from_orm_config(config).model_dump())


class TestEmailRequest(BaseModel):
    email: EmailStr


@router.post("/test-email")
async def test_email(
    data: TestEmailRequest,
    current_user: User = Depends(require_permission("settings.edit")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    config = await crud.get_config(db)

    if not config.smtp_enabled:
        return ApiResponse(code=-1, message="邮件服务未启用，请先开启SMTP配置")

    if not config.smtp_host or not config.smtp_port:
        return ApiResponse(code=-1, message="SMTP服务器配置不完整")

    if not config.smtp_username or not config.smtp_password:
        return ApiResponse(code=-1, message="SMTP用户名或密码未配置")

    try:
        msg = MIMEText("这是一封测试邮件，说明您的邮件配置已成功生效。", "plain", "utf-8")
        msg["Subject"] = "测试邮件 - 管理系统"
        msg["From"] = f"{config.smtp_from_name} <{config.smtp_from_email}>"
        msg["To"] = data.email

        if config.smtp_use_ssl:
            server = smtplib.SMTP_SSL(config.smtp_host, config.smtp_port, timeout=10)
        else:
            server = smtplib.SMTP(config.smtp_host, config.smtp_port, timeout=10)
            server.starttls()

        server.login(config.smtp_username, config.smtp_password)
        server.sendmail(config.smtp_from_email, [data.email], msg.as_string())
        server.quit()

        return ApiResponse(message="测试邮件发送成功")
    except smtplib.SMTPAuthenticationError:
        return ApiResponse(code=-1, message="SMTP认证失败，请检查用户名和密码")
    except smtplib.SMTPConnectError:
        return ApiResponse(code=-1, message="无法连接到SMTP服务器，请检查服务器地址和端口")
    except smtplib.SMTPException as e:
        return ApiResponse(code=-1, message=f"邮件发送失败: {e!s}")
    except TimeoutError:
        return ApiResponse(code=-1, message="SMTP连接超时，请检查网络或服务器配置")
    except Exception as e:
        return ApiResponse(code=-1, message=f"发送测试邮件时出错: {e!s}")

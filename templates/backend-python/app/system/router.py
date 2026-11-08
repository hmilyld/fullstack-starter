from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_permission
from app.core.schemas import ApiResponse
from app.system import service
from app.system.schemas import SystemConfigOut, SystemConfigUpdate, TestEmailRequest
from app.user.models import User

router = APIRouter(prefix="/system", tags=["系统设置"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/config")
async def get_system_config(
    current_user: Annotated[User, Depends(require_permission("settings"))],
    db: DbSession,
) -> ApiResponse[SystemConfigOut]:
    return ApiResponse(data=await service.get_config_out(db))


@router.put("/config")
async def update_system_config(
    data: SystemConfigUpdate,
    current_user: Annotated[User, Depends(require_permission("settings.edit"))],
    db: DbSession,
) -> ApiResponse[SystemConfigOut]:
    return ApiResponse(data=await service.update_config(db, data))


@router.post("/test-email")
async def test_email(
    data: TestEmailRequest,
    current_user: Annotated[User, Depends(require_permission("settings.edit"))],
    db: DbSession,
) -> ApiResponse[None]:
    await service.send_test_email(db, data.email)
    return ApiResponse(message="测试邮件发送成功")

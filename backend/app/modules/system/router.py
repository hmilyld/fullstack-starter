from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import User
from app.core.schemas import ApiResponse, SystemConfigOut, SystemConfigUpdate
from app.database import get_db
from app.deps import require_permission
from app.modules.system import crud

router = APIRouter(prefix="/system", tags=["系统设置"])


@router.get("/public-config")
async def get_public_config(
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    """公开接口：获取登录/注册页面需要的系统配置（无需认证）"""
    config = await crud.get_config(db)
    return ApiResponse(
        data={
            "siteName": config.site_name,
            "siteDescription": config.site_description,
            "maintenanceEnabled": config.maintenance_enabled,
            "maintenanceMessage": config.maintenance_message,
            "openRegistration": config.open_registration,
            "manualReview": config.manual_review,
        }
    )


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

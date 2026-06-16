from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.schemas import ApiResponse
from app.database import get_db
from app.modules.system import crud

router = APIRouter(prefix="/public", tags=["公开接口"])


@router.get("/config")
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

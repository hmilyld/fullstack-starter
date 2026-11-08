"""公开接口：登录/注册页所需的站点配置，无需认证。"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.schemas import ApiResponse
from app.system.schemas import PublicConfigOut
from app.system.service import get_config

router = APIRouter(prefix="/public", tags=["公开接口"])


@router.get("/config")
async def get_public_config(db: Annotated[AsyncSession, Depends(get_db)]) -> ApiResponse:
    config = await get_config(db)
    return ApiResponse(
        data=PublicConfigOut(
            siteName=config.site_name,
            siteDescription=config.site_description,
            maintenanceEnabled=bool(config.maintenance_enabled),
            maintenanceMessage=config.maintenance_message,
            openRegistration=bool(config.open_registration),
            manualReview=bool(config.manual_review),
        ).model_dump()
    )

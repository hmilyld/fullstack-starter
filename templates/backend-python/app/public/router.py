"""公开接口：登录/注册页所需的站点配置，无需认证。"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.schemas import ApiResponse
from app.system.schemas import PublicConfigOut
from app.system.service import get_config, public_out

router = APIRouter(prefix="/public", tags=["公开接口"])


@router.get("/config")
async def get_public_config(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ApiResponse[PublicConfigOut]:
    return ApiResponse(data=public_out(await get_config(db)))

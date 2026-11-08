from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_permission
from app.core.schemas import ApiResponse
from app.dashboard import service
from app.dashboard.schemas import ActivityItem, DashboardStats
from app.user.models import User

router = APIRouter(prefix="/dashboard", tags=["仪表盘"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/stats")
async def get_dashboard_stats(
    current_user: Annotated[User, Depends(require_permission("dashboard"))],
    db: DbSession,
) -> ApiResponse[DashboardStats]:
    return ApiResponse(data=await service.get_stats(db))


@router.get("/activity")
async def get_dashboard_activity(
    current_user: Annotated[User, Depends(require_permission("dashboard"))],
) -> ApiResponse[list[ActivityItem]]:
    return ApiResponse(data=service.get_activity())

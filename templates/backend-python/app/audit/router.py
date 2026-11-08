from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.audit import service
from app.core.database import get_db
from app.core.deps import require_permission
from app.core.pagination import Pagination, pagination_params
from app.core.schemas import ApiResponse, PaginatedData
from app.user.models import User

router = APIRouter(prefix="/audit-logs", tags=["审计日志"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
PaginationDep = Annotated[Pagination, Depends(pagination_params)]


def _parse_time(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


@router.get("")
async def get_audit_logs(
    current_user: Annotated[User, Depends(require_permission("audit_logs"))],
    db: DbSession,
    pagination: PaginationDep,
    userId: str = "",
    status: str = "",
    action: str = "",
    startTime: str = "",
    endTime: str = "",
) -> ApiResponse:
    user_id = int(userId.strip()) if userId.strip().isdigit() else None
    items, total = await service.list_logs(
        db,
        user_id=user_id,
        status=status,
        action=action,
        start_time=_parse_time(startTime),
        end_time=_parse_time(endTime),
        page=pagination.page,
        page_size=pagination.page_size,
    )
    return ApiResponse(
        data=PaginatedData(
            list=items, total=total, page=pagination.page, pageSize=pagination.page_size
        ).model_dump()
    )

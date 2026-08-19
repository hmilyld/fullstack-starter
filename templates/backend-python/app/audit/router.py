from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.audit import crud
from app.core.database import get_db
from app.core.deps import require_permission
from app.core.schemas import ApiResponse, PaginatedData
from app.user.models import User

router = APIRouter(prefix="/audit-logs", tags=["审计日志"])


def _parse_time(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


@router.get("")
async def get_audit_logs(
    userId: str = "",
    status: str = "",
    action: str = "",
    startTime: str = "",
    endTime: str = "",
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    current_user: User = Depends(require_permission("audit_logs")),
    db: AsyncSession = Depends(get_db),
) -> ApiResponse:
    user_id: int | None = None
    if userId.strip().isdigit():
        user_id = int(userId.strip())

    items, total = await crud.get_audit_logs(
        db,
        user_id=user_id,
        status=status,
        action=action,
        start_time=_parse_time(startTime),
        end_time=_parse_time(endTime),
        page=page,
        page_size=pageSize,
    )

    # 关联 users 表补全操作者用户名（查询不到时前端显示"未知"）
    user_ids = {item.user_id for item in items if item.user_id}
    username_map: dict[int, str] = {}
    if user_ids:
        result = await db.execute(select(User).where(User.id.in_(user_ids)))
        username_map = {u.id: u.username for u in result.scalars().all()}

    data = []
    for item in items:
        data.append(
            {
                "id": item.id,
                "userId": str(item.user_id) if item.user_id else "",
                "username": item.username or username_map.get(item.user_id, ""),
                "action": item.action,
                "ip": item.ip,
                "status": item.status,
                "detail": item.detail,
                "createdAt": item.created_at.isoformat() if item.created_at else "",
            }
        )
    return ApiResponse(
        data=PaginatedData(list=data, total=total, page=page, pageSize=pageSize).model_dump()
    )
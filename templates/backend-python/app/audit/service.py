"""审计日志：查询与写入。

审计写入必须独立于业务事务，且失败不影响业务响应。
"""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.audit.models import AuditLog
from app.audit.schemas import AuditLogOut
from app.core.database import async_session
from app.user.models import User


async def get_audit_logs(
    db: AsyncSession,
    *,
    user_id: int | None = None,
    status: str = "",
    action: str = "",
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[AuditLog], int]:
    query = select(AuditLog)
    if user_id is not None:
        query = query.where(AuditLog.user_id == user_id)
    if status:
        query = query.where(AuditLog.status == status)
    if action:
        query = query.where(AuditLog.action.ilike(f"%{action}%"))
    if start_time:
        query = query.where(AuditLog.created_at >= start_time)
    if end_time:
        query = query.where(AuditLog.created_at <= end_time)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    query = (
        query.order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list((await db.execute(query)).scalars().all()), total


async def list_logs(
    db: AsyncSession,
    *,
    user_id: int | None,
    status: str,
    action: str,
    start_time: datetime | None,
    end_time: datetime | None,
    page: int,
    page_size: int,
) -> tuple[list[dict], int]:
    items, total = await get_audit_logs(
        db,
        user_id=user_id,
        status=status,
        action=action,
        start_time=start_time,
        end_time=end_time,
        page=page,
        page_size=page_size,
    )

    # 关联 users 表补全操作者用户名（查询不到时前端显示"未知"）
    user_ids = {item.user_id for item in items if item.user_id}
    username_map: dict[int, str] = {}
    if user_ids:
        rows = await db.execute(select(User).where(User.id.in_(user_ids)))
        username_map = {user.id: user.username for user in rows.scalars().all()}

    return [
        AuditLogOut(
            id=str(item.id),
            userId=str(item.user_id) if item.user_id else "",
            username=item.username or username_map.get(item.user_id, ""),
            action=item.action,
            ip=item.ip,
            status=item.status,
            detail=item.detail or "",
            createdAt=item.created_at.isoformat() if item.created_at else "",
        ).model_dump()
        for item in items
    ], total


async def record(
    *,
    action: str,
    ip: str,
    status: str = "success",
    user_id: int | None = None,
    username: str = "",
    detail: str = "",
) -> None:
    """写一条审计日志。异常时静默失败，绝不影响业务响应。"""
    try:
        async with async_session() as session:
            session.add(
                AuditLog(
                    user_id=user_id,
                    username=username,
                    action=action,
                    ip=ip,
                    status=status,
                    detail=detail,
                )
            )
            await session.commit()
    except Exception:
        pass

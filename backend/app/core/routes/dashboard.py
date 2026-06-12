import random

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.models import User
from app.database import get_db
from app.deps import require_permission

router = APIRouter(prefix="/dashboard", tags=["仪表盘"])


@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(require_permission("dashboard")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(func.count(User.id)))
    total_users = result.scalar() or 0
    return {
        "code": 0,
        "message": "success",
        "data": {
            "totalUsers": total_users,
            "activeNow": random.randint(10, 100),
            "revenue": f"¥{random.randint(10000, 100000):,}",
            "growth": f"+{random.randint(5, 30)}%",
        },
    }


@router.get("/activity")
async def get_dashboard_activity(
    current_user: User = Depends(require_permission("dashboard")),
) -> dict:
    return {
        "code": 0,
        "message": "success",
        "data": [
            {"user": "张三", "action": "创建了新项目", "time": "2 分钟前"},
            {"user": "李四", "action": "更新了账户设置", "time": "15 分钟前"},
            {"user": "王五", "action": "上传了 3 个文件", "time": "1 小时前"},
            {"user": "赵六", "action": "发表了评论", "time": "2 小时前"},
            {"user": "孙七", "action": "完成了新手引导", "time": "5 小时前"},
        ],
    }

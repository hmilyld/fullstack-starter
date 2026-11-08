"""仪表盘：统计与近期活动。

三项指标是脚手架占位数据，接入真实业务后替换为实际查询。
"""

import random

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dashboard.schemas import ActivityItem, DashboardStats
from app.user.models import User


async def get_stats(db: AsyncSession) -> DashboardStats:
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    return DashboardStats(
        totalUsers=total_users,
        activeNow=random.randint(10, 100),
        revenue=f"¥{random.randint(10000, 100000):,}",
        growth=f"+{random.randint(5, 30)}%",
    )


def get_activity() -> list[ActivityItem]:
    return [
        ActivityItem(user="张三", action="创建了新项目", time="2 分钟前"),
        ActivityItem(user="李四", action="更新了账户设置", time="15 分钟前"),
        ActivityItem(user="王五", action="上传了 3 个文件", time="1 小时前"),
        ActivityItem(user="赵六", action="发表了评论", time="2 小时前"),
        ActivityItem(user="孙七", action="完成了新手引导", time="5 小时前"),
    ]

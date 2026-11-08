"""用户令牌版本与登出失效。

JWT 本身无状态，无法单独吊销。这里给每个用户维护一个 ``token_version``：

- 令牌里携带签发时的版本号；
- 校验时与数据库中的版本比对，不一致即视为已失效；
- 登出、改密、管理员重置密码都会递增版本，从而吊销该用户所有既有令牌。

这与 Java 侧 Sa-Token 的会话失效语义对齐，且不依赖服务端会话存储。
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.user.models import User


async def current_token_version(db: AsyncSession, user: User) -> int:
    """读取用户当前的令牌版本。

    用独立查询而不是访问 ORM 属性，避免会话缓存导致读到旧值。
    """
    result = await db.execute(select(User.token_version).where(User.id == user.id))
    return result.scalar_one_or_none() or 0


async def bump_token_version(db: AsyncSession, user: User) -> int:
    """递增令牌版本，吊销该用户所有既有令牌。"""
    version = await current_token_version(db, user) + 1
    user.token_version = version
    await db.flush()
    return version

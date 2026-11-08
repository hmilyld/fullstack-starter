"""数据库引擎、会话与声明式基类。"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """所有 ORM 模型的基类。结构由 Alembic 迁移管理，不依赖 create_all。"""


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """请求作用域的会话。

    正常返回时提交，抛异常时回滚并重新抛出——
    因此业务代码用异常表达失败，绝不会"先写库再返回 code -1"。
    """
    async with async_session() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        else:
            await session.commit()

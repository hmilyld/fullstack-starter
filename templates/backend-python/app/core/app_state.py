"""运行时状态：会话世代与菜单布局版本。

``session_epoch`` 用于让所有既有令牌失效（数据导入成功后轮换），
``menu_layout_version`` 用于菜单布局的乐观锁。
"""

import secrets

from sqlalchemy import Integer, String
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

STATE_ID = 1


class AppState(Base):
    __tablename__ = "app_state"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=STATE_ID)
    session_epoch: Mapped[str] = mapped_column(
        String(64), nullable=False, default=lambda: secrets.token_urlsafe(32)
    )
    menu_layout_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)


async def get_app_state(db: AsyncSession) -> AppState:
    state = await db.get(AppState, STATE_ID)
    if state is None:
        state = AppState(id=STATE_ID)
        db.add(state)
        await db.flush()
    return state

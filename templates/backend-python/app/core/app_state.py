import secrets

from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base


class AppState(Base):
    __tablename__ = "app_state"

    id = Column(Integer, primary_key=True, default=1)
    session_epoch = Column(String(64), nullable=False, default=lambda: secrets.token_urlsafe(32))
    menu_layout_version = Column(Integer, nullable=False, default=1)


async def get_app_state(db: AsyncSession) -> AppState:
    state = await db.get(AppState, 1)
    if state is None:
        state = AppState(id=1)
        db.add(state)
        await db.flush()
    return state

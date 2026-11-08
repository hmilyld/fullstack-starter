from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MenuGroup(Base):
    __tablename__ = "menu_groups"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class MenuItem(Base):
    __tablename__ = "menu_items"

    permission_code: Mapped[str] = mapped_column(String(100), primary_key=True)
    group_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    route: Mapped[str] = mapped_column(String(255), nullable=False)
    icon: Mapped[str] = mapped_column(String(50), nullable=False, default="circle")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    hidden: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

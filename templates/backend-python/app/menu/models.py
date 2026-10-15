from sqlalchemy import Boolean, Column, Integer, String

from app.core.database import Base


class MenuGroup(Base):
    __tablename__ = "menu_groups"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    is_system = Column(Boolean, nullable=False, default=False)


class MenuItem(Base):
    __tablename__ = "menu_items"

    permission_code = Column(String(100), primary_key=True)
    group_id = Column(String(50), nullable=False, index=True)
    route = Column(String(255), nullable=False)
    icon = Column(String(50), nullable=False, default="circle")
    sort_order = Column(Integer, nullable=False, default=0)
    is_system = Column(Boolean, nullable=False, default=False)

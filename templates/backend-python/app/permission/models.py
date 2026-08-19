from sqlalchemy import Column, String

from app.core.database import Base


class Permission(Base):
    __tablename__ = "permissions"

    code = Column(String(100), primary_key=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)
    parent = Column(String(100), nullable=True)
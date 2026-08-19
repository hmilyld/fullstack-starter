from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=True, index=True)
    username = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    ip = Column(String(50), nullable=False, default="")
    status = Column(String(20), nullable=False, default="success", index=True)
    detail = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
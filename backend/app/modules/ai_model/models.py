from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class AiModel(Base):
    __tablename__ = "ai_models"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alias = Column(String(100), unique=True, nullable=False, index=True)
    model_name = Column(String(100), nullable=False)
    api_url = Column(String(255), nullable=False)
    api_key = Column(String(255), nullable=False)
    description = Column(Text, default="")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AiModelPreset(Base):
    __tablename__ = "ai_model_presets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group = Column(String(100), nullable=False, index=True)
    alias = Column(String(100), nullable=False, index=True)
    model_name = Column(String(100), nullable=False)
    api_url = Column(String(255), nullable=False)
    description = Column(Text, default="")
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

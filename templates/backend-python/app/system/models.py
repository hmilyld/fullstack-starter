from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SystemConfig(Base):
    __tablename__ = "system_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    site_name: Mapped[str] = mapped_column(String(100), default="管理系统")
    site_description: Mapped[str] = mapped_column(Text, default="")
    keywords: Mapped[str] = mapped_column(String(255), default="")
    maintenance_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    maintenance_message: Mapped[str] = mapped_column(Text, default="")
    open_registration: Mapped[bool] = mapped_column(Boolean, default=True)
    manual_review: Mapped[bool] = mapped_column(Boolean, default=False)
    default_role_id: Mapped[str] = mapped_column(String(50), default="user")
    welcome_message: Mapped[str] = mapped_column(Text, default="")
    # 邮件配置
    smtp_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    smtp_host: Mapped[str] = mapped_column(String(255), default="")
    smtp_port: Mapped[int] = mapped_column(Integer, default=587)
    smtp_username: Mapped[str] = mapped_column(String(255), default="")
    smtp_password: Mapped[str] = mapped_column(String(255), default="")
    smtp_from_name: Mapped[str] = mapped_column(String(100), default="管理系统")
    smtp_from_email: Mapped[str] = mapped_column(String(100), default="")
    smtp_use_ssl: Mapped[bool] = mapped_column(Boolean, default=True)

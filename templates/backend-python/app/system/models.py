from sqlalchemy import Boolean, Column, Integer, String, Text

from app.core.database import Base


class SystemConfig(Base):
    __tablename__ = "system_config"

    id = Column(Integer, primary_key=True, default=1)
    site_name = Column(String(100), default="管理系统")
    site_description = Column(Text, default="")
    keywords = Column(String(255), default="")
    maintenance_enabled = Column(Boolean, default=False)
    maintenance_message = Column(Text, default="")
    open_registration = Column(Boolean, default=True)
    manual_review = Column(Boolean, default=False)
    default_role_id = Column(String(50), default="user")
    welcome_message = Column(Text, default="")
    # 邮件配置
    smtp_enabled = Column(Boolean, default=False)
    smtp_host = Column(String(255), default="")
    smtp_port = Column(Integer, default=587)
    smtp_username = Column(String(255), default="")
    smtp_password = Column(String(255), default="")
    smtp_from_name = Column(String(100), default="管理系统")
    smtp_from_email = Column(String(100), default="")
    smtp_use_ssl = Column(Boolean, default=True)
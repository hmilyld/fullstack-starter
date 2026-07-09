from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(String(50), ForeignKey("roles.id"), nullable=False)
    avatar = Column(String(255), default="")

    role = relationship("Role", back_populates="users")


class Role(Base):
    __tablename__ = "roles"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    is_preset = Column(Boolean, default=False)

    users = relationship("User", back_populates="role")
    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    role_id = Column(String(50), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    permission_code = Column(String(100), ForeignKey("permissions.code", ondelete="CASCADE"), nullable=False)

    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission")


class Permission(Base):
    __tablename__ = "permissions"

    code = Column(String(100), primary_key=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)
    parent = Column(String(100), nullable=True)


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

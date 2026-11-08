from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[str] = mapped_column(String(50), ForeignKey("roles.id"), nullable=False)
    avatar: Mapped[str] = mapped_column(String(255), default="")
    # 令牌版本：递增即吊销该用户所有既有令牌（登出、改密、重置密码）
    token_version: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    role: Mapped["Role"] = relationship(back_populates="users")  # noqa: F821

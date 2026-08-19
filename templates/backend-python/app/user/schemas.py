from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    username: str
    name: str
    email: EmailStr
    roleId: str
    password: str = "123456"

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("密码长度不能少于6位")
        return v


class UserUpdate(BaseModel):
    username: str | None = None
    name: str | None = None
    email: EmailStr | None = None
    roleId: str | None = None
    avatar: str | None = None


class ResetPasswordRequest(BaseModel):
    newPassword: str

    @field_validator("newPassword")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("密码长度不能少于6位")
        return v


class BatchRoleUpdateRequest(BaseModel):
    userIds: list[int]
    roleId: str


class UserOut(BaseModel):
    id: str
    username: str
    name: str
    email: str
    roleId: str
    avatar: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_model(cls, user):
        return cls(
            id=str(user.id),
            username=user.username,
            name=user.name,
            email=user.email,
            roleId=user.role_id,
            avatar=user.avatar or "",
        )


class UpdateMeRequest(BaseModel):
    name: str
    email: EmailStr


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str

    @field_validator("newPassword")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("密码长度不能少于6位")
        return v
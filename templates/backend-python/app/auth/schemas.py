from pydantic import BaseModel, EmailStr, field_validator


class LoginRequest(BaseModel):
    account: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("密码长度不能少于6位")
        return v


class AuthUser(BaseModel):
    id: str
    name: str
    email: str
    avatar: str
    role: str
    permissions: list[str] = []


class LoginResponse(BaseModel):
    token: str
    user: AuthUser
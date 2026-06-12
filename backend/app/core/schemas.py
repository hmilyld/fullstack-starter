from pydantic import BaseModel, EmailStr, field_validator

# ============================================================
# Common
# ============================================================


class ApiResponse(BaseModel):
    code: int = 0
    message: str = "success"
    data: dict | list | None = None


class PaginatedData(BaseModel):
    list: list
    total: int
    page: int
    pageSize: int


# ============================================================
# Auth
# ============================================================


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


# ============================================================
# User
# ============================================================


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


# ============================================================
# Role
# ============================================================


class RoleCreate(BaseModel):
    name: str
    description: str = ""
    permissions: list[str] = []


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    permissions: list[str] | None = None


class RoleOut(BaseModel):
    id: str
    name: str
    description: str
    permissions: list[str]
    isPreset: bool

    model_config = {"from_attributes": True}


# ============================================================
# Permission
# ============================================================


class PermissionCreate(BaseModel):
    code: str
    name: str
    type: str  # "menu" or "operation"
    parent: str | None = None


class PermissionUpdate(BaseModel):
    name: str | None = None
    parent: str | None = None


class PermissionOut(BaseModel):
    code: str
    name: str
    type: str
    parent: str | None = None

    model_config = {"from_attributes": True}


# ============================================================
# System Config
# ============================================================


class SystemConfigUpdate(BaseModel):
    siteName: str | None = None
    siteDescription: str | None = None
    keywords: str | None = None
    maintenanceEnabled: bool | None = None
    maintenanceMessage: str | None = None
    openRegistration: bool | None = None
    manualReview: bool | None = None
    defaultRoleId: str | None = None
    welcomeMessage: str | None = None


class SystemConfigOut(BaseModel):
    siteName: str
    siteDescription: str
    keywords: str
    maintenanceEnabled: bool
    maintenanceMessage: str
    openRegistration: bool
    manualReview: bool
    defaultRoleId: str
    welcomeMessage: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_config(cls, config) -> "SystemConfigOut":
        return cls(
            siteName=config.site_name,
            siteDescription=config.site_description,
            keywords=config.keywords,
            maintenanceEnabled=config.maintenance_enabled,
            maintenanceMessage=config.maintenance_message,
            openRegistration=config.open_registration,
            manualReview=config.manual_review,
            defaultRoleId=config.default_role_id,
            welcomeMessage=config.welcome_message,
        )

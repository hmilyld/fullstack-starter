import re
from urllib.parse import urlparse

from pydantic import BaseModel, field_validator


class AiModelCreate(BaseModel):
    alias: str
    modelName: str
    apiUrl: str
    apiKey: str
    description: str = ""
    isDefault: bool = False

    @field_validator("alias")
    @classmethod
    def validate_alias(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError("别名只能包含字母、数字、下划线和连字符")
        return v

    @field_validator("apiUrl")
    @classmethod
    def validate_api_url(cls, v: str) -> str:
        parsed = urlparse(v)
        if parsed.scheme not in ("https", "http"):
            raise ValueError("API 地址必须使用 https 或 http 协议")
        if not parsed.hostname:
            raise ValueError("API 地址格式无效")
        return v


class AiModelUpdate(BaseModel):
    alias: str | None = None
    modelName: str | None = None
    apiUrl: str | None = None
    apiKey: str | None = None
    description: str | None = None
    isDefault: bool | None = None

    @field_validator("alias")
    @classmethod
    def validate_alias(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError("别名只能包含字母、数字、下划线和连字符")
        return v

    @field_validator("apiUrl")
    @classmethod
    def validate_api_url(cls, v: str | None) -> str | None:
        if v is None:
            return v
        parsed = urlparse(v)
        if parsed.scheme not in ("https", "http"):
            raise ValueError("API 地址必须使用 https 或 http 协议")
        if not parsed.hostname:
            raise ValueError("API 地址格式无效")
        return v


class AiModelOut(BaseModel):
    id: str
    alias: str
    modelName: str
    apiUrl: str
    apiKey: str
    description: str
    isDefault: bool

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_model(cls, model) -> "AiModelOut":
        return cls(
            id=str(model.id),
            alias=model.alias,
            modelName=model.model_name,
            apiUrl=model.api_url,
            apiKey=model.api_key,
            description=model.description or "",
            isDefault=model.is_default,
        )


class AiModelPublicOut(BaseModel):
    """不含 API Key 的公开输出 schema，用于未认证接口"""
    id: str
    alias: str
    modelName: str
    apiUrl: str
    description: str
    isDefault: bool

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_model(cls, model) -> "AiModelPublicOut":
        return cls(
            id=str(model.id),
            alias=model.alias,
            modelName=model.model_name,
            apiUrl=model.api_url,
            description=model.description or "",
            isDefault=model.is_default,
        )


class AiModelTestRequest(BaseModel):
    apiUrl: str
    apiKey: str
    modelName: str

    @field_validator("apiUrl")
    @classmethod
    def validate_api_url(cls, v: str) -> str:
        parsed = urlparse(v)
        if parsed.scheme not in ("https", "http"):
            raise ValueError("API 地址必须使用 https 或 http 协议")
        if not parsed.hostname:
            raise ValueError("API 地址格式无效")
        # 阻止访问内网和元数据端点
        hostname = parsed.hostname
        blocked = [
            "169.254.169.254",  # AWS/GCP/Azure 元数据
            "metadata.google.internal",  # GCP 元数据
            "localhost", "127.0.0.1", "::1",
        ]
        if hostname in blocked:
            raise ValueError("禁止访问该地址")
        # 阻止 RFC 1918 私有地址
        import ipaddress
        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback or ip.is_link_local:
                raise ValueError("禁止访问内网地址")
        except ValueError:
            if "metadata" in hostname:
                raise ValueError("禁止访问元数据端点")
        return v


class AiModelTestResult(BaseModel):
    success: bool
    message: str
    responseTime: float | None = None
    model: str | None = None


# ============================================================
# AI Model Preset
# ============================================================


class AiModelPresetCreate(BaseModel):
    group: str
    alias: str
    modelName: str
    apiUrl: str
    description: str = ""
    isActive: bool = True
    sortOrder: int = 0


class AiModelPresetUpdate(BaseModel):
    group: str | None = None
    alias: str | None = None
    modelName: str | None = None
    apiUrl: str | None = None
    description: str | None = None
    isActive: bool | None = None
    sortOrder: int | None = None


class AiModelPresetOut(BaseModel):
    id: str
    group: str
    alias: str
    modelName: str
    apiUrl: str
    description: str
    isActive: bool
    sortOrder: int

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_model(cls, model) -> "AiModelPresetOut":
        return cls(
            id=str(model.id),
            group=model.group,
            alias=model.alias,
            modelName=model.model_name,
            apiUrl=model.api_url,
            description=model.description or "",
            isActive=model.is_active,
            sortOrder=model.sort_order,
        )

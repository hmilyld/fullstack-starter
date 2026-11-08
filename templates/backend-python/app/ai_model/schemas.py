import ipaddress
import re
import socket
from urllib.parse import urlparse

from pydantic import BaseModel, field_validator

# 云元数据端点，必须无条件拒绝
_METADATA_HOSTS = frozenset(
    {
        "169.254.169.254",  # AWS / GCP / Azure 元数据
        "metadata.google.internal",  # GCP 元数据
    }
)


def mask_api_key(api_key: str) -> str:
    """脱敏 API Key：短于 12 位完全隐藏，否则只显示前 2 位和后 2 位。"""
    if not api_key or len(api_key) < 12:
        return "****"
    return api_key[:2] + "****" + api_key[-2:]


def _reject_unsafe_ip(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> None:
    if ip.is_private or ip.is_loopback or ip.is_link_local:
        raise ValueError("禁止访问内网地址")
    if ip.is_reserved or ip.is_multicast or ip.is_unspecified:
        raise ValueError("禁止访问该地址")


def assert_not_private_host(url: str) -> None:
    """拒绝访问内网地址与云元数据端点（SSRF 防护）。

    仅检查 IP 字面量是不够的：``127.0.0.1.nip.io`` 这类域名会解析到内网。
    因此域名必须**先解析**，再对解析结果逐条判定。
    """
    parsed = urlparse(url)
    hostname = parsed.hostname
    if not hostname:
        raise ValueError("API 地址格式无效")

    host = hostname.lower()
    if host in _METADATA_HOSTS or "metadata" in host:
        raise ValueError("禁止访问元数据端点")

    try:
        _reject_unsafe_ip(ipaddress.ip_address(host))
        return
    except ValueError as exc:
        if "禁止访问" in str(exc):
            raise
        # 不是 IP 字面量，继续做 DNS 解析

    try:
        resolved = socket.getaddrinfo(host, None)
    except socket.gaierror:
        # 无法解析（离线、内网 DNS 等）时放行：此处无法静态判定，
        # 与 Java 侧保持一致，交由请求层防护。能解析的域名必须逐条判定。
        return

    for _family, _type, _proto, _canon, sockaddr in resolved:
        address = sockaddr[0]
        try:
            _reject_unsafe_ip(ipaddress.ip_address(address))
        except ValueError as exc:
            if "禁止访问" in str(exc):
                raise ValueError(f"禁止访问内网地址（{host} 解析为 {address}）") from exc


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
        assert_not_private_host(v)
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
        assert_not_private_host(v)
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
            apiKey=mask_api_key(model.api_key),
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
    modelId: int | None = None
    apiUrl: str | None = None
    apiKey: str | None = None
    modelName: str | None = None

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
        assert_not_private_host(v)
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

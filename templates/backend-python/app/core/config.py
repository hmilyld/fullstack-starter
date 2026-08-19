import warnings
from functools import lru_cache

from pydantic_settings import BaseSettings

_DEFAULT_SECRET = "your-secret-key-change-in-production"

# 已知的默认/弱密钥，使用这些值启动时直接拒绝，避免生产环境使用弱密钥
_WEAK_SECRETS = {
    _DEFAULT_SECRET,
    "secret",
    "your-secret-key",
    "your-secret",
    "123456",
    "changeme",
}


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite+aiosqlite:///./app.db"

    # JWT
    jwt_secret_key: str = _DEFAULT_SECRET
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 1440

    # CORS
    cors_origins: list[str] = ["http://localhost:5173"]

    # 审计日志排除路径（前缀匹配），如认证接口由业务显式记录
    audit_exclude_paths: list[str] = ["/api/auth"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    def model_post_init(self, __context: object) -> None:
        if not self.jwt_secret_key:
            raise RuntimeError("JWT_SECRET_KEY 不能为空，请在 .env 或环境变量中设置")
        if self.jwt_secret_key in _WEAK_SECRETS:
            raise RuntimeError(
                "JWT_SECRET_KEY 使用了默认或弱密钥，出于安全考虑拒绝启动。"
                "请设置一个强随机密钥，例如: openssl rand -base64 48"
            )
        if len(self.jwt_secret_key) < 32:
            warnings.warn(
                "JWT_SECRET_KEY 长度不足 32 字符，建议使用更强的密钥",
                stacklevel=2,
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()

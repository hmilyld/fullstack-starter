import warnings
from functools import lru_cache

from pydantic_settings import BaseSettings

_DEFAULT_SECRET = "your-secret-key-change-in-production"


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite+aiosqlite:///./app.db"

    # JWT
    jwt_secret_key: str = _DEFAULT_SECRET
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 1440

    # CORS
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    def model_post_init(self, __context: object) -> None:
        if self.jwt_secret_key == _DEFAULT_SECRET:
            warnings.warn(
                "JWT_SECRET_KEY 使用了默认值，请在 .env 中设置安全的密钥",
                stacklevel=2,
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()

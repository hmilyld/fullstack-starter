from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class MenuGroupCreate(CamelModel):
    name: str = Field(min_length=1, max_length=100)


class MenuGroupUpdate(CamelModel):
    name: str = Field(min_length=1, max_length=100)


class MenuItemCreate(CamelModel):
    permission_code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=100)
    group_id: str
    route: str = Field(min_length=1, max_length=255)
    icon: str = Field(default="circle", max_length=50)

    @field_validator("route")
    @classmethod
    def validate_route(cls, value: str) -> str:
        if not value.startswith("/") or value.startswith("//"):
            raise ValueError("路由必须以单个 / 开头")
        return value


class MenuItemUpdate(CamelModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    group_id: str | None = None
    route: str | None = Field(default=None, min_length=1, max_length=255)
    icon: str | None = Field(default=None, max_length=50)

    @field_validator("route")
    @classmethod
    def validate_route(cls, value: str | None) -> str | None:
        if value is not None and (not value.startswith("/") or value.startswith("//")):
            raise ValueError("路由必须以单个 / 开头")
        return value


class MenuLayoutItem(CamelModel):
    permission_code: str
    sort_order: int


class MenuLayoutGroup(CamelModel):
    id: str
    sort_order: int
    items: list[MenuLayoutItem]


class MenuLayoutUpdate(CamelModel):
    version: int
    groups: list[MenuLayoutGroup]

"""分页参数解析。

契约要求 `page` 与 `pageSize` 越界时**钳制而非报错**（见 docs/contract/api.md）。
直接使用 `Query(ge=1, le=100)` 会让越界请求返回 422，与契约不符，
因此统一收敛到这里，业务代码只消费已钳制的值。
"""

from dataclasses import dataclass

from fastapi import Query

DEFAULT_PAGE = 1
DEFAULT_PAGE_SIZE = 10
MAX_PAGE_SIZE = 100


def clamp_page(page: int | None) -> int:
    if page is None or page < 1:
        return DEFAULT_PAGE
    return page


def clamp_page_size(page_size: int | None) -> int:
    if page_size is None:
        return DEFAULT_PAGE_SIZE
    return max(1, min(MAX_PAGE_SIZE, page_size))


@dataclass(frozen=True)
class Pagination:
    """请求作用域内的分页参数，已完成钳制。"""

    page: int
    page_size: int

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


def pagination_params(
    page: int = Query(DEFAULT_PAGE, description="页码，从 1 开始；越界自动钳制"),
    page_size: int = Query(
        DEFAULT_PAGE_SIZE, alias="pageSize", description="每页条数，1..100；越界自动钳制"
    ),
) -> Pagination:
    return Pagination(page=clamp_page(page), page_size=clamp_page_size(page_size))

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { parsePage, useUrlListState } from "./use-url-list-state"

function Harness() {
  const { search, page, setSearch, setPage } = useUrlListState()

  return (
    <div>
      <span data-testid="state">{`${search}|${page}`}</span>
      <input
        aria-label="搜索"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <button type="button" onClick={() => setPage(page + 1)}>
        下一页
      </button>
    </div>
  )
}

describe("useUrlListState", () => {
  it("parses invalid page values as 1", () => {
    expect(parsePage(null)).toBe(1)
    expect(parsePage("0")).toBe(1)
    expect(parsePage("-2")).toBe(1)
    expect(parsePage("3")).toBe(3)
  })

  it("reads and writes q/page in the URL", async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/settings/user?q=abc&page=2"]}>
        <Harness />
      </MemoryRouter>
    )

    expect(screen.getByTestId("state")).toHaveTextContent("abc|2")

    await user.clear(screen.getByRole("textbox", { name: "搜索" }))
    await user.type(screen.getByRole("textbox", { name: "搜索" }), "张")
    expect(screen.getByTestId("state")).toHaveTextContent("张|1")

    await user.click(screen.getByRole("button", { name: "下一页" }))
    expect(screen.getByTestId("state")).toHaveTextContent("张|2")
  })
})

import { flushPromises, mount } from "@vue/test-utils"
import { defineComponent, h, nextTick } from "vue"
import { createMemoryHistory, createRouter } from "vue-router"
import { describe, expect, it } from "vitest"
import { useUrlListState } from "./use-url-list-state"

async function setup() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: { template: "<div />" } }],
  })
  await router.push("/")
  await router.isReady()

  let state!: ReturnType<typeof useUrlListState>
  mount(
    defineComponent({
      setup() {
        state = useUrlListState()
        return () => h("div")
      },
    }),
    { global: { plugins: [router] } }
  )

  return { router, state }
}

describe("useUrlListState", () => {
  it("reads q and page from the URL", async () => {
    const { router, state } = await setup()
    await router.push("/?q=张&page=3")
    await nextTick()

    expect(state.search.value).toBe("张")
    expect(state.page.value).toBe(3)
  })

  it("writes search and clears page", async () => {
    const { router, state } = await setup()
    await router.push("/?q=张&page=3")
    await nextTick()

    state.setSearch("李")
    await flushPromises()

    expect(router.currentRoute.value.query.q).toBe("李")
    expect(router.currentRoute.value.query.page).toBeUndefined()
  })

  it("removes q when searching with blank input", async () => {
    const { router, state } = await setup()
    await router.push("/?q=张")
    await nextTick()

    state.setSearch("   ")
    await flushPromises()

    expect(router.currentRoute.value.query.q).toBeUndefined()
  })

  it("parses invalid page values as 1 and writes page 1 as missing", async () => {
    const { router, state } = await setup()
    await router.push("/?page=abc")
    await nextTick()
    expect(state.page.value).toBe(1)

    state.setPage(1)
    await flushPromises()
    expect(router.currentRoute.value.query.page).toBeUndefined()
  })
})

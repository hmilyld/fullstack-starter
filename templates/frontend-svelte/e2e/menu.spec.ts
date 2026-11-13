import { expect, test } from "@playwright/test"

import { mockApi, seedAuth } from "./mocks"

test("opens menu & permissions and expands operation permissions", async ({
  page,
}) => {
  await mockApi(page)
  await seedAuth(page)

  await page.goto("/settings/menu")

  await expect(page.getByRole("heading", { name: "菜单与权限" })).toBeVisible()
  await expect(page.getByText("/settings/user")).toBeVisible()

  await page
    .getByRole("button", {
      name: "展开 用户管理 的操作权限",
      exact: true,
    })
    .click()

  await expect(page.getByText("新增用户")).toBeVisible()
  await expect(page.getByText("users.create")).toBeVisible()

  await page
    .getByRole("button", { name: "菜单与权限 的操作", exact: true })
    .click()
  await page.getByRole("menuitem", { name: "隐藏菜单" }).click()
  await expect(page.getByText("确认隐藏菜单")).toBeVisible()
  await page.getByRole("button", { name: "取消" }).click()
  await expect(page.getByText("确认隐藏菜单")).not.toBeVisible()
})

test("disables structural actions while sorting is saving", async ({
  page,
}) => {
  await mockApi(page)
  await seedAuth(page)

  await page.goto("/settings/menu")
  await expect(page.getByText("/settings/user")).toBeVisible()

  await page
    .getByRole("button", { name: "用户管理 的操作", exact: true })
    .click()
  await page.getByRole("menuitem", { name: "下移" }).click()

  const addGroup = page.getByRole("button", { name: "新增分组" })
  await expect(addGroup).toBeDisabled()
  await expect(addGroup).toBeEnabled({ timeout: 5000 })
})

test("confirms hiding a critical menu from the edit form", async ({ page }) => {
  await mockApi(page)
  await seedAuth(page)

  await page.goto("/settings/menu")
  await expect(page.getByText("/settings/user")).toBeVisible()

  await page
    .getByRole("button", { name: "编辑 菜单与权限", exact: true })
    .click()
  await expect(page.getByText("编辑菜单")).toBeVisible()

  await page.locator("#item-visible").click()
  await page.getByRole("button", { name: "保存" }).click()

  const confirm = page.getByRole("alertdialog")
  await expect(confirm.getByText("确认隐藏菜单")).toBeVisible()
  await confirm.getByRole("button", { name: "取消" }).click()

  await expect(page.getByText("确认隐藏菜单")).not.toBeVisible()
  await expect(page.getByText("编辑菜单")).toBeVisible()
})

test("uses indented cards on compact viewports", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockApi(page)
  await seedAuth(page)

  await page.goto("/settings/menu")
  await expect(page.getByText("/settings/user")).toBeVisible()
  await expect(page.locator("table")).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "新增菜单" }).first()
  ).toBeVisible()
})

test("drags a menu row to reorder", async ({ page }) => {
  await mockApi(page)
  await seedAuth(page)

  await page.goto("/settings/menu")
  await expect(page.getByText("/settings/user")).toBeVisible()

  const source = page.getByRole("button", {
    name: "拖动 用户管理 排序",
    exact: true,
  })
  const target = page.getByRole("button", {
    name: "拖动 菜单与权限 排序",
    exact: true,
  })
  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  expect(sourceBox).not.toBeNull()
  expect(targetBox).not.toBeNull()
  if (!sourceBox || !targetBox) return

  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2
  )
  await page.mouse.down()
  await page.mouse.move(sourceBox.x + 10, sourceBox.y + 10, { steps: 5 })
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 10 }
  )
  await page.mouse.up()

  const rows = await page.locator("tbody tr").allTextContents()
  const usersIndex = rows.findIndex((text) => text.includes("用户管理"))
  const menusIndex = rows.findIndex((text) => text.includes("菜单与权限"))
  expect(usersIndex).toBeGreaterThan(menusIndex)
})

test("collapses and expands a group", async ({ page }) => {
  await mockApi(page)
  await seedAuth(page)

  await page.goto("/settings/menu")
  await expect(page.getByText("/settings/user")).toBeVisible()

  await page
    .getByRole("button", { name: "收起 管理 分组", exact: true })
    .click()
  await expect(page.getByText("/settings/user")).not.toBeVisible()

  await page
    .getByRole("button", { name: "展开 管理 分组", exact: true })
    .click()
  await expect(page.getByText("/settings/user")).toBeVisible()
})

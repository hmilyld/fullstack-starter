# 前端三端设计规范（Vue）

本文件是 `frontend-vue` 模板的布局、交互与 Token 约定，与 `frontend-react/DESIGN.md` 保持同一份契约。新增页面必须遵守，不要在页面里重新发明断点、卡片、分页或弹窗结构。

## 1. 三端模式

| 模式 | 断点 | 导航 | 列表 | 筛选 | 弹窗 |
|---|---|---|---|---|---|
| Compact | `< 768px` | 左侧 Sheet 抽屉 | 卡片 + “更多”菜单 | 底部筛选 Sheet | 居中、内部滚动 |
| Medium | `768–1023px` | 48px 图标栏 | 表格 + 优先列 | 2–3 列内联 | 居中 |
| Expanded | `≥ 1024px` | 256px 完整侧边栏 | 表格 + 全部列 | 多列内联 | 居中 |

补充规则：

- **布局按宽度切换，控件密度按输入方式切换**。触屏设备通过 `pointer: coarse` 放大控件；Compact 宽度下也始终使用触控尺寸。
- 内容最大宽度 `1440px`，超宽屏居中，不把表格或表单拉满整屏。
- Medium 默认收起侧边栏为图标栏；Expanded 默认展开。用户手动切换后写入 cookie。
- 顶栏固定：左侧为菜单/面包屑，右侧为主题切换与账户菜单。账户菜单统一放在右上角（`UserMenu.vue`），不要放回侧边栏底部。

## 2. Token

定义在 `src/assets/main.css`：

| Token | Compact | Medium | Expanded | 用途 |
|---|---|---|---|---|
| `--layout-gutter` | 16px | 24px | 24px | 页面左右留白 |
| `--layout-max` | 100% | 100% | 1440px | 内容最大宽度 |
| `--page-gap` | 16px | 24px | 24px | 页面区块间距 |
| `--control-h` | 44px | 32 / 44px¹ | 32 / 44px¹ | 输入、按钮高度 |
| `--icon-btn` | 40px | 28 / 40px¹ | 28 / 40px¹ | 图标按钮 |
| `--icon-btn-xs` | 36px | 24 / 36px¹ | 24 / 36px¹ | 小图标按钮 |
| `--dialog-inset` | 16px | 24px | 24px | 弹窗安全边距 |

¹ 鼠标环境取小值，`pointer: coarse` 取大值。

页面根节点统一使用 `gap-(--page-gap)`；主内容区由 `AdminLayout.vue` 统一 `max-w-(--layout-max)` 与 `px-(--layout-gutter)`。

## 3. 组件约定

| 场景 | 使用 | 不要 |
|---|---|---|
| 页面标题 | `PageHeader.vue` | 手写 `h1` + `p` |
| 列表卡片 | `ListShell.vue` | 每页重复 Card + 分页 |
| 手机列表项 | `RecordCard.vue` | 手机硬塞表格 |
| 行操作 | `RowActions.vue` | 4 个图标挤在一行 |
| 分页 | `TablePagination.vue` | 手写上一页/下一页 |
| 新增/编辑 | `FormDialog.vue` | 自写 Dialog + 表单 |
| 空态 | `EmptyState.vue` | “暂无数据”纯文本 |
| 加载失败 | `ErrorState.vue` / `InlineError.vue` | 只弹 Toast |
| 筛选 | 桌面内联；手机 `Sheet side="bottom"` | 手机堆 5 个筛选框 |
| 导航开关 | `SidebarTrigger` | 自写菜单按钮 |
| 账户菜单 | `UserMenu.vue`（Header 右上角） | 侧边栏底部用户块 |

`ui/sidebar` 已内置移动端 Sheet 与 `openMobile` 状态；不要在 Header 里另造移动抽屉。

## 4. 列优先级

| 表 | 始终显示 | `≥768` | `≥1024` | `≥1280` |
|---|---|---|---|---|
| 用户 | 用户名、角色、操作 | 姓名 | 邮箱 | — |
| 角色 | 名称、类型、操作 | 描述 | 权限数 | — |
| AI 模型 | 别名、状态、操作 | 模型名称 | API 地址 | Key、描述 |
| AI 预设 | 分组、别名、状态、操作 | 模型名称 | API 地址、排序 | 描述 |
| 审计 | 时间、动作、状态 | 操作者 | IP | 详情 |
| 权限总览 | 名称、编码、类型 | — | — | — |

- 菜单与权限页使用三级树形表格：分组 → 菜单 → 操作权限；操作权限为独立行，不单独成页。
- 桌面列：名称、类型、路由 / 权限编码、标记、操作；操作列 `sticky right-0`。分组和菜单可拖拽，操作权限按编码排序、不参与拖拽。
- 操作按钮：新增/编辑直接露出；隐藏、上下移、删除收进“更多”；`<768px` 使用缩进卡片，不横向滚动。
- 角色权限使用宽弹窗（`sm:max-w-4xl`）+ 权限树表格：勾选菜单会级联选中全部操作，半选表示部分授予；`<768px` 使用手风琴卡片，保留搜索与全选/清空。
- 角色名称/描述按表单容器宽度两列排布（`@md/field-group`），窄屏自动堆叠，避免窄弹窗里单个输入框占满整行。
- 权限总览只读，不提供新增/编辑/删除按钮。

- 表格操作列使用 `sticky right-0`，避免横向滚动时找不到操作。
- 手机端不显示表格，使用卡片；不要在手机端保留横向滚动表格作为主交互。

## 5. 交互与可访问性

- 触控目标不小于 44×44（Web 最低 24×24，本模板按更严格的触控标准执行）；相邻目标间距至少 8px。
- 所有图标按钮必须有可访问名称；优先 `aria-label`，不要只靠 Tooltip。
- 破坏性操作必须二次确认。
- 表单错误显示在字段附近，并使用 `data-invalid` / `aria-invalid`。
- 弹窗必须包含 `DialogTitle` / `SheetTitle`；关闭按钮文案为中文。
- 支持 `prefers-reduced-motion`；不要依赖动画结束才可见。
- 菜单排序必须同时提供拖拽、键盘和“上移/下移”三种方式（WCAG 2.5.7）；拖拽结束即保存，写操作期间禁用排序与其他菜单/操作写操作。

## 6. 新页面检查清单

- [ ] 页面根节点使用 `gap-(--page-gap)`
- [ ] 标题区使用 `PageHeader`
- [ ] 列表使用 `ListShell` + `TablePagination`
- [ ] `<768px` 有卡片形态，操作在 `RowActions`
- [ ] 表格按优先级隐藏列，操作列 sticky
- [ ] 空态、错误态、加载态齐全
- [ ] 筛选在手机使用 Sheet
- [ ] 弹窗有 Title、取消/提交、内部滚动
- [ ] 图标按钮有 `aria-label`
- [ ] 在 390 / 768 / 1440 三个宽度检查无横向页面滚动

## 7. PWA 与测试

- PWA manifest 由 `src/lib/pwa.ts` 在运行时根据「站点名称 / 描述 + 当前主题」生成，`usePwaManifest()` 在 `App.vue` 中挂载。
- `App.vue` 统一负责站点配置加载态、全局 Toaster 和页面异常兜底；Toast 主题跟随 `useThemeStore().resolvedTheme`，移动端位置在顶栏下方。
- 站点信息保存后调用 `siteConfig.refresh()`，侧边栏、页面标题、`theme-color`、`application-name` 与 manifest 同步更新。
- 静态 `manifest.webmanifest` 只作为首屏回退；运行时使用 Blob URL 覆盖。
- 图标位于 `public/icons/`：`icon.svg`、`icon-192.png`、`icon-512.png`、`icon-512-maskable.png`、`apple-touch-icon.png`（180）。替换品牌图标时同步更新 `index.html`、`vite.config.ts`、`src/lib/pwa.ts` 与本节。
- 单元/组件测试使用 Vitest + `@testing-library/vue`（必要时配合 `@vue/test-utils`）：`npm test`（单次）、`npm run test:watch`、`npm run test:coverage`。
- E2E 使用 Playwright：首次执行 `npx playwright install chromium`，随后 `npm run test:e2e`；覆盖登录、手机卡片/抽屉、URL 筛选恢复。
- 新增共享组件或纯函数必须补单元测试；列表页/表单页至少补一个渲染或交互 smoke test。

## 8. 与 React 模板的对齐契约

Vue 与 React 使用不同的组件库，但布局、交互和状态约定必须一致：

- 三端断点、Token、页面壳、列优先级、卡片/表格切换、弹窗与筛选模式保持一致。
- **URL 状态键**：
  - 列表：`q`、`page`（第 1 页省略 `page`）。
  - 审计日志：`userId`、`status`、`action`、`startTime`、`endTime`、`page`。
  - AI 模型：`tab=models|presets`、`page`、`presetQ`、`presetGroup`。
  - 搜索输入以 URL 为唯一来源；输入使用 `replace`，请求侧做 300ms 防抖；搜索变化时删除 `page`。
- 表单：字段使用可见 Label + `for/id`；控件补 `name`；非登录字段 `autocomplete="off"`；邮箱/编码/URL 等 `:spellcheck="false"`；错误贴近字段展示。
- 导航：页面跳转使用链接语义（`RouterLink` / `<a>`），不要用按钮 `@click` 模拟跳转。
- 状态：Pinia store 保存会话、站点配置和主题；列表请求使用 `usePagedList`，URL 状态使用 `useUrlListState` / `useUrlPage`，不要在各页面重复实现。
- PWA：manifest 名称/描述/主题色/图标清单与 React 保持一致；运行时 manifest + 静态回退。
- 测试：Vue 使用 Vitest + `@testing-library/vue`；共享层/纯函数保持与 React 同等的测试范围（含 PWA、图标和菜单拖拽逻辑），关键页面至少一个渲染或交互 smoke test。

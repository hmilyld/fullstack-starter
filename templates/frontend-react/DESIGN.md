# 前端三端设计规范

本文件是 `frontend-react` 模板的布局、交互与 Token 约定。新增页面必须遵守，不要在页面里重新发明断点、卡片、分页或弹窗结构。

## 1. 三端模式

| 模式 | 断点 | 导航 | 列表 | 筛选 | 弹窗 |
|---|---|---|---|---|---|
| Compact | `< 768px` | 左侧 Sheet 抽屉 | 卡片 + “更多”菜单 | 底部筛选 Sheet | 居中、内部滚动 |
| Medium | `768–1023px` | 56px 图标栏 | 表格 + 优先列 | 2–3 列内联 | 居中 |
| Expanded | `≥ 1024px` | 256px 完整侧边栏 | 表格 + 全部列 | 多列内联 | 居中 |

补充规则：

- **布局按宽度切换，控件密度按输入方式切换**。触屏设备通过 `pointer: coarse` 放大控件；Compact 宽度下也始终使用触控尺寸。
- 内容最大宽度 `1440px`，超宽屏居中，不把表格或表单拉满整屏。
- Medium 默认收起侧边栏为图标栏；Expanded 默认展开。用户手动切换后写入 cookie。

## 2. Token

定义在 `src/index.css`：

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

页面根节点统一使用 `gap-(--page-gap)`；主内容区由 `AdminLayout` 统一 `max-w-(--layout-max)` 与 `px-(--layout-gutter)`。

## 3. 组件约定

| 场景 | 使用 | 不要 |
|---|---|---|
| 页面标题 | `PageHeader` | 手写 `h1` + `p` |
| 列表卡片 | `ListShell` | 每页重复 Card + 分页 |
| 手机列表项 | `RecordCard` | 手机硬塞表格 |
| 行操作 | `RowActions` | 4 个图标挤在一行 |
| 分页 | `TablePagination` | 手写上一页/下一页 |
| 新增/编辑 | `FormDialog` | 自写 Dialog + 表单 |
| 空态 | `EmptyState` | “暂无数据”纯文本 |
| 加载失败 | `ErrorState` / `InlineError` | 只弹 Toast |
| 筛选 | 桌面内联；手机 `Sheet side="bottom"` | 手机堆 5 个筛选框 |
| 导航开关 | `SidebarTrigger` | 自写菜单按钮 |

`ui/sidebar` 已内置移动端 Sheet 与 `openMobile` 状态；不要在 Header 里另造移动抽屉。

## 4. 列优先级

| 表 | 始终显示 | `≥768` | `≥1024` | `≥1280` |
|---|---|---|---|---|
| 用户 | 用户名、角色、操作 | 姓名 | 邮箱 | — |
| 角色 | 名称、类型、操作 | 描述 | 权限数 | — |
| AI 模型 | 别名、状态、操作 | 模型名称 | API 地址 | Key、描述 |
| AI 预设 | 分组、别名、状态、操作 | 模型名称 | API 地址、排序 | 描述 |
| 审计 | 时间、动作、状态 | 操作者 | IP | 详情 |
| 权限 | 名称、编码、类型、操作 | — | — | — |

- 表格操作列使用 `sticky right-0`，避免横向滚动时找不到操作。
- 手机端不显示表格，使用卡片；不要在手机端保留横向滚动表格作为主交互。

## 5. 交互与可访问性

- 触控目标不小于 44×44（Web 最低 24×24，本模板按更严格的触控标准执行）；相邻目标间距至少 8px。
- 所有图标按钮必须有可访问名称；优先 `aria-label`，不要只靠 Tooltip。
- 破坏性操作必须二次确认。
- 表单错误显示在字段附近，并使用 `data-invalid` / `aria-invalid`。
- 弹窗必须包含 `DialogTitle` / `SheetTitle`；关闭按钮文案为中文。
- 支持 `prefers-reduced-motion`；不要依赖动画结束才可见。
- 菜单排序必须同时提供拖拽、键盘和“上移/下移”三种方式（WCAG 2.5.7）。

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

- PWA manifest 由 `src/lib/pwa.ts` 在运行时根据「站点名称 / 描述 + 当前主题」生成，`PwaManifest` 挂载在 `SiteConfigProvider` 内。
- 站点信息保存后调用 `useSiteConfig().refresh()`，侧边栏、页面标题、`theme-color`、`application-name` 与 manifest 同步更新。
- 静态 `manifest.webmanifest` 只作为首屏回退；运行时使用 Blob URL 覆盖。
- 图标位于 `public/icons/`：`icon.svg`、`icon-192.png`、`icon-512.png`、`icon-512-maskable.png`、`apple-touch-icon.png`（180）。替换品牌图标时同步更新 `index.html`、`vite.config.ts`、`src/lib/pwa.ts` 与本节。
- 测试使用 Vitest + React Testing Library：`npm test`（单次）、`npm run test:watch`、`npm run test:coverage`。
- 新增共享组件或纯函数必须补单元测试；列表页/表单页至少补一个渲染或交互 smoke test。

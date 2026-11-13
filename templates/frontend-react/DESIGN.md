# 前端设计系统（frontend-react）

本文件是 `frontend-react` 模板的**唯一视觉真源**：色彩、字体、间距、圆角、组件形态、页面结构与交互约定。新增或修改页面必须遵循；不要在页面里重新发明断点、卡片、分页或弹窗。

视觉方向参照 [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin)：**蓝灰中性色 + 深藏蓝主色 + 克制的高饱和图表色**，密集但可扫读的运营后台。目标不是"花哨"，而是"精密工具"：层级清楚、边界明确、数字对齐、状态一眼可辨。

其余两套前端必须与本文件保持同一套 Token 与页面结构（允许组件实现不同）。

**新增模块时的使用顺序**：先查 §6 有没有可复用组件（能组合就不新建）→ 按 §7 的页面配方搭骨架 → 用 §10 决定列优先级 → 用 §11 自检 → 三套同步实现与验证。Token 与结构不允许只有一侧。

---

## 1. 设计原则

1. **结构即信息**：边框、分隔线、分组标签只用来表达层级，不做装饰。
2. **一屏之内可判断**：首屏必须回答"系统现在什么状态"——指标、趋势、最近动作三者缺一不可。
3. **主色只给关键动作**：一屏最多一个主按钮；其余用 `outline` / `ghost`。
4. **状态用色，身份不用色**：成功/警告/失败/信息有语义色；角色、分组等身份信息用中性色阶，不靠随机彩色区分。
5. **边界靠 border，深度靠 shadow**：卡片 `border + shadow-sm`，不叠加 `ring` 模拟描边；浮层才用 `shadow-lg`。
6. **数字必须对齐**：所有数值、计数、金额使用 `tabular-nums`。
7. **动效服务于变化**：只保留进入/展开/反馈三类，时长 120–240ms，`prefers-reduced-motion` 下全部退化为瞬时。

---

## 2. 色彩

所有颜色以 OKLCH 定义于全局 CSS。**中性色一律带蓝相（hue ≈ 256–265）**，不使用 chroma = 0 的纯灰——纯灰在屏幕上显脏、显廉价。

### 2.1 语义 Token（亮色）

| Token                  | 值                           | 用途                |
| ---------------------- | ---------------------------- | ------------------- |
| `--background`         | `oklch(1 0 0)`               | 页面底色            |
| `--foreground`         | `oklch(0.129 0.042 264.695)` | 主文本              |
| `--card`               | `oklch(1 0 0)`               | 卡片                |
| `--popover`            | `oklch(1 0 0)`               | 浮层                |
| `--primary`            | `oklch(0.208 0.042 265.755)` | 主按钮、品牌块      |
| `--primary-foreground` | `oklch(0.984 0.003 247.858)` | 主色上的文字        |
| `--secondary`          | `oklch(0.968 0.007 247.896)` | 次级按钮、标签底    |
| `--muted`              | `oklch(0.968 0.007 247.896)` | 弱化底、骨架屏      |
| `--muted-foreground`   | `oklch(0.554 0.046 257.417)` | 辅助文本（≥ 4.5:1） |
| `--accent`             | `oklch(0.968 0.007 247.896)` | hover / 选中底      |
| `--destructive`        | `oklch(0.577 0.245 27.325)`  | 删除、失败          |
| `--success`            | `oklch(0.52 0.13 152)`       | 成功、在线          |
| `--warning`            | `oklch(0.666 0.157 74.3)`    | 待处理、告警        |
| `--info`               | `oklch(0.546 0.157 258)`     | 提示、审核中        |
| `--border`             | `oklch(0.929 0.013 255.508)` | 边框、分隔线        |
| `--input`              | `oklch(0.929 0.013 255.508)` | 表单描边            |
| `--ring`               | `oklch(0.62 0.035 257)`      | 焦点环（≥ 3:1）     |

### 2.2 语义 Token（暗色）

`--background oklch(0.129 0.042 264.695)`、`--card oklch(0.14 0.04 259.21)`（比底色略亮一档，靠 border 分界）、`--popover oklch(0.208 0.042 265.755)`、`--primary oklch(0.929 0.013 255.508)`（反相为浅色按钮）、`--border oklch(1 0 0 / 10%)`、`--input oklch(1 0 0 / 15%)`、`--ring oklch(0.704 0.04 256.788)`。

暗色下**品牌色不换相**：`--sidebar-*` 全部由 `--background` / `--foreground` / `--primary` 间接引用，禁止在 `.dark` 里另写一个品牌色。

### 2.3 图表色

图表是仪表盘的第一视觉，必须成体系，不能是灰阶。

| Token       | 亮色                             | 暗色                            |
| ----------- | -------------------------------- | ------------------------------- |
| `--chart-1` | `oklch(0.646 0.222 41.116)` 橙   | `oklch(0.488 0.243 264.376)` 靛 |
| `--chart-2` | `oklch(0.6 0.118 184.704)` 青    | `oklch(0.696 0.17 162.48)` 绿   |
| `--chart-3` | `oklch(0.398 0.07 227.392)` 深蓝 | `oklch(0.769 0.188 70.08)` 黄   |
| `--chart-4` | `oklch(0.828 0.189 84.429)` 明黄 | `oklch(0.627 0.265 303.9)` 紫   |
| `--chart-5` | `oklch(0.769 0.188 70.08)` 琥珀  | `oklch(0.645 0.246 16.439)` 红  |

规则：

- 单序列用 `--chart-1`，多序列按 1→5 顺序取，最多 5 条；失败 / 拦截用 `--destructive`。
- 图表一律自绘 SVG（`TrendChart`），**不引入图表库**：面积用 `var(--chart-1)` → 透明渐变（起始 `stop-opacity: 0.34`），折线 `stroke-width: 2` + `vector-effect: non-scaling-stroke`。
- 网格线是 `border/70` 的 1px 横线，不画坐标轴线；刻度文字 `--muted-foreground`、10–11px、`tabular-nums`。
- 图例必须有文字，不能只靠颜色区分序列；数据点用 `<title>` 给出当天明细。
- 图表必须附带 `sr-only` 数据表，让屏幕阅读器读到同样的数值。
- 无数据时给"图表骨架 + 一句说明"，不要渲染空坐标系。

### 2.4 侧边栏

`--sidebar` 引用 `--background`（亮色为白、暗色随底色），`--sidebar-accent` 引用 `--accent`。当前项 = `bg-sidebar-accent + font-medium`，与底色的亮度差必须 ≥ 0.03，不允许"几乎看不见"的选中态。

---

## 3. 字体与字阶

| 角色        | 字体                                                 | 说明                           |
| ----------- | ---------------------------------------------------- | ------------------------------ |
| 正文 / UI   | `Inter Variable`（`@fontsource-variable/inter`）     | 自托管，无外链                 |
| 标题 / 数字 | `Manrope Variable`（`@fontsource-variable/manrope`） | 用于页面标题、统计数值、品牌名 |

中文由系统字体回退，因此 Manrope 只作用于拉丁字符与数字，不会破坏中文排版。

| 层级    | 规格                                         | 使用位置              |
| ------- | -------------------------------------------- | --------------------- |
| Display | 30/36, 600, `tracking-tight`                 | 统计卡数值            |
| H1      | 24/32, 600, `tracking-tight`, `text-balance` | `PageHeader`          |
| H2      | 16/24, 600                                   | `CardTitle`、区块标题 |
| Body    | 14/20, 400                                   | 表格、表单、正文      |
| Small   | 13/18, 400                                   | 辅助说明、表头        |
| Micro   | 12/16, 500                                   | 徽标、时间戳、`kbd`   |

规则：

- 正文最小 12px，可点击文字不小于 14px。
- 标题用 `text-wrap: balance`，正文段落用 `text-pretty`。
- 数字列、金额、计数一律 `tabular-nums`。
- 不用全大写小标签（CJK 下无意义），不做"一个小词变色/斜体"的标题点缀。
- 引号用 `“ ”`，省略号用 `…`。

---

## 4. 间距、圆角与层级

### 4.1 间距

基准 4px。页面节奏只有三档：

| Token             | 值                            | 用途                       |
| ----------------- | ----------------------------- | -------------------------- |
| `--layout-gutter` | 16px（Compact）/ 24px（≥768） | 页面左右留白               |
| `--page-gap`      | 16px                          | 页面区块间距               |
| `--card-spacing`  | 24px                          | 卡片内边距与卡片内元素间距 |

字段组间距 24px（`FieldGroup` 的 `gap-6`），标签与控件 12px（`Field` 的 `gap-3`）；表格单元格 `px-4 py-3`，行高由内容决定；按钮组间距 8px。标题与其下方内容的间距必须小于区块之间的间距。

### 4.2 圆角（单一体系，`--radius: 0.625rem`）

| 类             | 值   | 使用                           |
| -------------- | ---- | ------------------------------ |
| `rounded-sm`   | 6px  | 徽标内的小块、`kbd`            |
| `rounded-md`   | 8px  | **按钮、输入框、下拉项、标签** |
| `rounded-lg`   | 10px | 分段控件、提示条               |
| `rounded-xl`   | 14px | **卡片、弹窗、浮层容器**       |
| `rounded-2xl`  | 18px | 品牌块、登录卡片               |
| `rounded-full` | —    | 头像、状态点                   |

`--radius` 到 `--radius-4xl` 的映射为 `r-4 / r-2 / r / r+4 / r+8 / r+12 / r+16`。**禁止**再写 `rounded-[min(var(--radius-4xl),24px)]` 这类一次性魔法值。

### 4.3 高度与层级

| Token            | 桌面（pointer: fine） | 触屏（`pointer: coarse` 或 < 768px） |
| ---------------- | --------------------- | ------------------------------------ |
| `--control-h`    | 36px                  | 44px                                 |
| `--icon-btn`     | 32px                  | 40px                                 |
| `--icon-btn-xs`  | 28px                  | 36px                                 |
| `--dialog-inset` | 24px                  | 16px                                 |

阴影：卡片 `shadow-sm`；下拉/选择器 `shadow-lg`；弹窗 `shadow-xl`；按钮 `shadow-xs`。**同一个元素只用一种边界手段**：卡片用 1px border，不再叠 `ring-foreground/5`。

### 4.4 布局宽度

内容最大宽 `--layout-max`：Compact / Medium 为 `100%`，≥1024px 起设为 `96rem`（1536px）。96rem 大于 1280，所以实际只有 ≥1536px 才真正限宽。**侧边栏收起后内容必须随可用宽度铺满**，任何宽度下都不要给内容区固定宽度——否则收起侧边栏反而缩小可用区域，用户会认为布局出错。顶栏与内容区共用同一最大宽与左右留白，保证面包屑与页面标题左对齐。

---

## 5. 三端模式

| 模式     | 断点         | 导航             | 列表              | 筛选           | 弹窗           |
| -------- | ------------ | ---------------- | ----------------- | -------------- | -------------- |
| Compact  | `< 768px`    | 左侧 Sheet 抽屉  | 卡片 + “更多”菜单 | 底部筛选 Sheet | 居中、内部滚动 |
| Medium   | `768–1279px` | 48px 图标栏      | 表格 + 优先列     | 2–3 列内联     | 居中           |
| Expanded | `≥ 1280px`   | 256px 完整侧边栏 | 表格 + 全部列     | 多列内联       | 居中           |

- **布局按宽度切换，控件密度按输入方式切换**：触屏通过 `pointer: coarse` 放大控件，Compact 宽度下始终使用触控尺寸。
- Medium（<1280）默认收起为图标栏，Expanded 默认展开，用户切换后写入 cookie。**低于 1280 时忽略已保存的展开状态**：平板打开就是图标栏，用户本次仍可手动展开。
- **运行时跨断点同样生效**：从 ≥1280 缩到 <1280 时自动收起（不写 cookie，桌面偏好保留）；回到宽屏不强制展开。
- 顶栏固定：左侧菜单键 + 面包屑，右侧搜索、主题、账户菜单。**账户菜单固定在右上角**，不放回侧边栏底部。
- 触控目标不小于 44×44，相邻目标间距至少 8px。

---

## 6. 组件规范

### 6.1 基础件

| 组件                            | 形态                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                        | 高 `--control-h`，`rounded-md`，`text-sm font-medium`，`gap-2`，`shadow-xs`；主按钮 `bg-primary`，次按钮 `border + bg-background`，危险操作 `bg-destructive/10 + text-destructive`                                                                                                                                                                                                                                  |
| `Input` / `Select` / `Textarea` | `rounded-md`，`border-input`，`bg-transparent`，`shadow-xs`；聚焦时 `border-ring + ring-[3px] ring-ring`                                                                                                                                                                                                                                                                                                            |
| `DateTimeField`                 | 输入框外观（同 `--control-h`、同宽）＋中文月历浮层：周一为首、今天用 `ring` 标记、方向键移动（整个日历只占一个 Tab 落点）、时分两位数字输入且失焦即提交。值为 `YYYY-MM-DDTHH:mm`，展示 `YYYY/MM/DD HH:mm`（与表格、筛选 chip 一致）。格子 32px，`pointer: coarse` 下 44px、面板 352px。**不使用原生 `datetime-local`**：中文界面下它固定显示 `mm/dd/yyyy, --:-- --`，且各浏览器盒模型不一致，会比其他输入框更高更宽 |
| `Card`                          | `rounded-xl border bg-card shadow-sm`，内边距 24px，内部间距 24px；标题 16/600，说明 13/muted                                                                                                                                                                                                                                                                                                                       |
| `Badge`                         | `rounded-md`，`h-5`，`text-xs font-medium`；语义变体 `success / warning / info / destructive / secondary / outline`                                                                                                                                                                                                                                                                                                 |
| `Sonner`                        | 语义色写在全局 CSS 的 `[data-sonner-theme]` 规则里，深浅色各一套；**不要用 `color-mix` 与白色混合**，浏览器会把白色的 hue 当作 0 参与插值，绿色会偏成品红                                                                                                                                                                                                                                                           |
| `Table`                         | 表头 `h-11 px-4 text-[13px] text-muted-foreground`，单元格 `px-4 py-3`，行 `border-b` + hover `bg-muted/50`；紧凑密度下表头 `h-9`、单元格 `py-1.5`                                                                                                                                                                                                                                                                  |
| `Dialog`                        | `rounded-xl border shadow-xl`，标题 18/600，底部操作右对齐                                                                                                                                                                                                                                                                                                                                                          |
| `DropdownMenu` / `Select` 内容  | `rounded-xl border shadow-lg`，选项 `rounded-md`                                                                                                                                                                                                                                                                                                                                                                    |
| `Tabs`                          | 轨道 `rounded-lg bg-muted p-[3px]`，触发器 `rounded-md`，选中 `bg-background shadow-xs`；设置页的 `SettingsNav` 用 `variant="line"`（无底色轨道）                                                                                                                                                                                                                                                                   |
| `Skeleton`                      | `bg-muted` + 1.6s 微光，不做彩色脉冲                                                                                                                                                                                                                                                                                                                                                                                |
| `EmptyState`                    | 虚线边框容器 + 图标底块 + 标题 + 说明 + 主操作，垂直居中                                                                                                                                                                                                                                                                                                                                                            |

### 6.2 结构件

| 组件           | 约定                                                                                                                                                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AppSidebar`   | 顶部品牌块：32px 方形 logo（`bg-sidebar-primary`）+ 站点名（Manrope 600）+ 一行副标题（12px muted）；中部菜单按分组，分组可折叠且记住展开状态；底部只放「快速查找」入口，不放版本号（与页脚重复），**不放账户菜单**                             |
| `Header`       | Compact 56px / ≥768px 64px，`border-b`，滚动超过 10px 出现轻阴影；左：`SidebarTrigger` + 面包屑（Compact 下换成当前页标题）；右：搜索（⌘K）、主题、外观设置、账户                                                                               |
| `CommandMenu`  | ⌘K / Ctrl+K 打开，搜索路由、菜单项与外观动作；空查询时先列「最近」；↑↓ 选择、Enter 跳转、Esc 关闭；无结果给说明                                                                                                                                 |
| `ConfigDrawer` | 外观设置抽屉：主题、侧栏样式（默认 / 浮动 / 内嵌）、折叠方式（图标栏 / 抽屉）；配置存 localStorage，侧栏与抽屉共用                                                                                                                              |
| 侧栏变体       | `默认` 通栏；`浮动` 侧栏本体 `m-2 rounded-2xl shadow-sm`；`内嵌` 内容面板 `m-2 ml-0 rounded-2xl ring-1 ring-border` 且 **`overflow-clip`**——否则顶栏等子元素的底色会盖住面板的圆角，角落里看不到弧线。用 `clip` 不用 `hidden`，避免打断表头吸顶 |
| `PageHeader`   | H1 + 一行说明 + 右侧操作；Compact 下操作换行且主操作全宽                                                                                                                                                                                        |
| `ListShell`    | 卡片外壳：标题/说明/工具栏 → 内容 → 底部分页；工具栏在 Compact 下纵向堆叠                                                                                                                                                                       |

### 6.3 状态色映射

| 场景                   | 变体                 |
| ---------------------- | -------------------- |
| 管理员角色             | `default`（primary） |
| 内置角色               | `secondary`          |
| 自定义角色             | `outline`            |
| 成功 / 启用 / 在线     | `success`            |
| 待审核 / 待处理 / 预警 | `warning`            |
| 审核中 / 提示          | `info`               |
| 失败 / 禁用 / 删除     | `destructive`        |

### 6.4 共享组件清单

新增页面只能组合下列组件，不要另起一套。路径按各栈惯例；组件名与职责必须一致。

| 场景   | 组件                                                       | 说明                                             |
| ------ | ---------------------------------------------------------- | ------------------------------------------------ |
| 页面壳 | `AdminLayout` / `AppSidebar` / `Header`                    | 布局与导航，页面里不重写                         |
| 标题区 | `PageHeader`                                               | H1 + 说明 + 右侧操作                             |
| 列表   | `DataList`                                                 | 列驱动表格 + 手机卡片 + 加载/错误/空态的唯一入口 |
| 列表   | `ListShell` / `TablePagination`                            | 卡片外壳与分页（含每页条数）                     |
| 列表   | `ColumnToggle` / `DensityToggle`                           | 列显隐与表格密度，按表记忆                       |
| 列表   | `RowActions` / `BulkActionsBar`                            | 行操作菜单、多选悬浮操作栏                       |
| 卡片   | `RecordCard`                                               | 手机端的记录卡片                                 |
| 表单   | `FormDialog` / `ConfirmDeleteDialog` / `ConfirmHideDialog` | 新建编辑、删除确认、隐藏确认                     |
| 表单   | `Field` + `FieldLabel`                                     | 标签与控件成组，错误就地显示                     |
| 表单   | `DateTimeField`                                            | 日期时间，规则见 6.1                             |
| 表单   | `PasswordInput` / `IconPicker` / `InlineError`             | 密码、图标、字段级错误                           |
| 反馈   | `EmptyState` / `ErrorState` / `LoadingButton`              | 空、错、提交中                                   |
| 导航   | `SettingsNav` / `CommandMenu` / `ConfigDrawer`             | 设置左栏、⌘K 面板、外观抽屉                      |
| 展示   | `TrendChart` / `Badge` / `RoleBadge`                       | 趋势图与状态标识                                 |

---

## 7. 页面配方

### 7.1 仪表盘

首屏结构固定为四段（顺序不可调换）：

1. **标题行**：`PageHeader`，右侧一个刷新类操作。
2. **指标行**：4 张统计卡，`sm:grid-cols-2 lg:grid-cols-4`；每卡 = 标签 + 图标（16px，muted）+ 数值（30/600 `tabular-nums`）+ 一行副文本（环比或说明）。
3. **图表行**：`lg:grid-cols-7`，趋势图占 4 栏、最近动态占 3 栏。图表卡必须有标题、说明与图例；趋势图是自绘 SVG（`TrendChart`），7 天、成功用 `--chart-1` 面积、失败用 `--destructive` 折线。
4. **快捷入口**：有权限的页面入口，`sm:grid-cols-2`，图标 + 名称 + 一句说明。

占位数据必须就地标注（例如数值旁的小号“演示数据”），不得用整屏 `Alert` 打断首屏。

### 7.2 列表页

`PageHeader` → `ListShell` 工具栏（左侧计数、右侧搜索 + 列 + 主操作）→ 表格容器 → `TablePagination`。**不要再套一层卡片、也不要重复页面标题**：表格自带独立边框容器。≥768 用表格，<768 用 `RecordCard`；空态、错误态、加载态齐全；操作列 `sticky right-0`。

- 表格由 `DataList` 的列定义驱动（`header / cell / hideable / pinRight`；列宽样式由各栈列定义字段控制），页面不再手写 `<Table>`；单元格 `px-4 py-3`，表头 `h-11`，行高约 58px；
- 工具栏的「列」菜单与列头的「隐藏此列」都控制同一份显隐状态，按表名记忆在 localStorage，名称列与操作列不可隐藏；
- 工具栏的「密度」在舒适 / 紧凑之间切换，按表记忆；紧凑时单元格 `py-1.5`、表头 `h-9`；
- 分页栏提供每页条数（8/16/32 或 10/20/50），切换后回到第 1 页；
- 表头吸顶：`Card` 用 `overflow-clip`（不建立滚动容器），桌面端表格容器不横向滚动（靠列优先级与 `truncate` 控制宽度），`html` 设 `scroll-padding-top: 5rem` 防止焦点被表头遮挡；
- 手机端不显示表格，使用卡片；不要在手机端保留横向滚动表格作为主交互。

### 7.3 表单页

卡片分组，每组一个 `CardHeader`（标题 + 说明）；字段用 `Field` + 可见 `FieldLabel`，错误贴近字段；底部操作右侧对齐，主操作在最后。

### 7.4 设置类页面

设置页是「分类多、字段少」的页面，使用**左栏竖向导航 + 右侧内容**：

- 标题区下方加一条 `Separator`，页面本身铺满内容区，不再整体居中限宽；
- **≥1024px 为左栏**：`lg:w-1/5 lg:min-w-44` + `sticky top-20`，右侧内容列 `flex-1 min-w-0`；<1024px 横向排列。这里比站点导航（1280）早一档是有意的：此时侧栏已收成图标栏，横向空间足够放下左栏 + 表单；
- 导航用 `SettingsNav`：**无底色轨道**的 ghost 列表，图标 + 文案，导航项 `min-h-9 px-4 py-2`（36px，行距 4px），选中 `bg-muted`、悬停 `bg-accent`；不要用「灰底分段控件 + 白色胶囊」——那是表单内的分段选择器，不是页面导航；
- <768px：同一个 Tabs 变成横向 ghost 行，允许 `flex-wrap` 换行；**不要给它 `overflow-x-auto`**，否则 36px 高的行里会多出一条横向滚动条；
- 分区用 `Card variant="plain"`：无边框/底纹，分区标题 18px + 分隔线 + 表单；`max-w-3xl`（系统设置）/ `max-w-2xl`（个人设置）控制阅读宽度；
- Tabs 的方向由 `useMediaQuery` 决定，保证键盘方向键与视觉方向一致。

### 7.5 登录 / 注册

桌面左右分栏：左侧 `bg-primary` 品牌面板（logo 方块 + 站点名 + 一句话价值 + 能力列表），右侧表单列 `max-w-sm`。`<lg` 隐藏品牌面板，在表单上方显示紧凑品牌行。登录卡片 `rounded-2xl border shadow-xl`。

---

## 8. 动效

| 场景        | 规格                                                         |
| ----------- | ------------------------------------------------------------ |
| 浮层进入    | `fade-in` + `zoom-in-95`，150ms                              |
| 折叠展开    | 高度过渡 200ms `ease-out`                                    |
| 悬停 / 聚焦 | 颜色与阴影 150ms                                             |
| 页面切换    | 只做 140ms 淡入 + 4px 上移（`content-in`），不做整页位移动画 |
| 骨架屏      | 透明度微光 1.6s 循环                                         |

`prefers-reduced-motion: reduce` 下动画时长降至 0.01ms（已在全局 CSS 处理），不依赖动画结束才可见。

---

## 9. 可访问性底线

- 正文与占位文本对比度 ≥ 4.5:1，大字 ≥ 3:1；彩色底上的次要文字用同色相前景，不用灰。
- 焦点必须可见：`focus-visible` 使用实色 `--ring` 3px，禁止只给 `outline-none`。
- 图标按钮必须有可访问名称（`aria-label` 或 `sr-only` 文本）。
- 破坏性操作二次确认；提交中按钮显示加载态并禁用。
- 表单控件有 `label` / `htmlFor`；错误用 `aria-invalid` + 就地提示。
- 弹窗包含标题；移动端弹窗 `overscroll-behavior: contain`。
- 表格横向滚动时操作列固定在右侧；手机不显示表格。
- 键盘可达：菜单折叠、命令面板、日期选择器、弹窗均可纯键盘操作；日历整组只占一个 Tab 落点，进入后用方向键移动。

---

## 10. 列优先级

| 表       | 始终显示               | `≥768`   | `≥1024`        | `≥1280`   |
| -------- | ---------------------- | -------- | -------------- | --------- |
| 用户     | 用户名、角色、操作     | 姓名     | 邮箱           | —         |
| 角色     | 名称、类型、操作       | 描述     | 权限数         | —         |
| AI 模型  | 别名、状态、操作       | 模型名称 | API 地址       | Key、描述 |
| AI 预设  | 分组、别名、状态、操作 | 模型名称 | API 地址、排序 | 描述      |
| 审计     | 时间、动作、状态       | 操作者   | IP             | 详情      |
| 权限总览 | 名称、编码、类型       | —        | —              | —         |

菜单与权限页使用三级树形表格：分组 → 菜单 → 操作权限；分组和菜单可拖拽，操作权限按编码排序、不参与拖拽；`<768px` 使用缩进卡片。

---

## 11. 新页面检查清单

- [ ] 页面根节点 `flex flex-col gap-(--page-gap)`
- [ ] 标题区使用 `PageHeader`
- [ ] 列表使用 `ListShell` + `TablePagination`
- [ ] `<768px` 有卡片形态，操作在 `RowActions`
- [ ] 表格按优先级隐藏列，操作列 sticky
- [ ] 空态、错误态、加载态齐全
- [ ] 筛选在手机使用 Sheet；桌面筛选网格 `md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5`，两列时间控件同排，避免列宽压到内容截断
- [ ] 日期字段用 `DateTimeField`，不用原生 `datetime-local`
- [ ] 新控件先落到 `components/shared/`（或 `ui/`），页面里不写一次性实现
- [ ] 弹窗有 Title、取消/提交、内部滚动
- [ ] 图标按钮有 `aria-label`
- [ ] 数字列 `tabular-nums`
- [ ] 颜色只用 Token，不写死 hex
- [ ] 深浅色都已检查；对比度达标
- [ ] 390 / 768 / 1440 三个宽度无横向滚动
- [ ] 纯键盘可完成主流程

---

## 12. PWA 与测试

- PWA manifest 由 `src/lib/pwa.ts` 运行时生成（站点名称/描述 + 当前主题），应用入口在站点配置加载后同步 manifest；静态 `manifest.webmanifest` 仅作首屏回退。
- 图标位于各栈的静态目录（React/Vue `public/icons/`，Svelte `static/icons/`）：`icon.svg`、`icon-192.png`、`icon-512.png`、`icon-512-maskable.png`、`apple-touch-icon.png`（180）。替换品牌图标时同步应用入口 HTML、Vite 配置、`src/lib/pwa.ts` 与本文件。
- 单元/组件测试：Vitest + React Testing Library（`npm test`、`npm run test:coverage`）。
- E2E：Playwright（`npm run test:e2e`），覆盖登录、手机卡片/抽屉、平板默认收起与跨断点收起、URL 筛选恢复、列显隐与表格密度持久化、命令面板最近访问、日期时间选择器。
- 新增共享组件或纯函数必须补单元测试；列表页/表单页至少一个渲染或交互 smoke test。

---

## 13. 前端对齐契约

- Token：各模板的全局 CSS 与本文件第 2、4 节逐项一致（颜色、圆角映射、字体、高度、最大宽）。
- 结构：三端断点、页面壳、列优先级、卡片/表格切换、弹窗与筛选模式保持一致。
- **URL 状态键**：
  - 列表：`q`、`page`（第 1 页省略 `page`）。
  - 审计日志：`userId`、`status`、`action`、`startTime`、`endTime`、`page`。
  - AI 模型：`tab=models|presets`、`page`、`presetQ`、`presetGroup`。
- 搜索输入以 URL 为唯一来源；输入用 `replace`，请求侧 300ms 防抖；搜索变化时删除 `page`。
- 表单：可见 Label + `id/htmlFor`；控件补 `name`；非登录字段 `autoComplete="off"`；邮箱/编码/URL `spellCheck={false}`。
- 导航：页面跳转用链接语义（`<a>` 或框架 Link），不用按钮点击模拟跳转。
- 主题：`class="dark"` + `color-scheme`；`meta theme-color` 随主题更新。
- 图表：三套都是自绘 SVG，无图表依赖；坐标、配色、文案、`sr-only` 数据表逐项一致。
- 日期时间：三套共用同一套 `lib/date-time.ts`（解析 / 组合 / 展示），值格式 `YYYY-MM-DDTHH:mm`、展示 `YYYY/MM/DD HH:mm`。
- 本文件的三份副本必须结构一致：平台差异只允许出现在标题、CSS 路径、测试库和路由 API 上。
- 一致性有脚本兜底：在仓库根目录运行 `npm run sync:design:check`，会比对三份 `DESIGN.md` 的结构，以及第 2.1 节的 Token 与三个全局 CSS 是否相同。改了 Token 或组件规格后必须跑一次。

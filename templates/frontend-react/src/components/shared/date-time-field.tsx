import * as React from "react"
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from "lucide-react"

import { inputClassName } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  buildMonthCells,
  formatDateTimeInput,
  formatMonthLabel,
  nowParts,
  parseDateTimeInput,
  toDateTimeInput,
  todayKey,
} from "@/lib/date-time"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"]
const PLACEHOLDER = "选择日期时间"

/** 方向键在日历里移动的天数 */
const ARROW_STEPS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
}

const pad = (value: number) => String(value).padStart(2, "0")

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

type DateTimeFieldProps = {
  value: string
  onChange: (value: string) => void
  id?: string
  /** 保留表单字段名的语义，值以隐藏域提交 */
  name?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  "aria-label"?: string
  "aria-labelledby"?: string
}

/**
 * 日期时间选择：输入框外观 + 中文月历 + 时分输入。
 * 原生 `input[type=datetime-local]` 在中文界面下固定显示英文
 * `mm/dd/yyyy, --:-- --`，且各浏览器的盒模型不一致，这里自绘以保证
 * 与其他输入框同高同宽、文案和深色模式统一。
 */
export function DateTimeField({
  value,
  onChange,
  id,
  name,
  placeholder = PLACEHOLDER,
  disabled,
  className,
  ...a11y
}: DateTimeFieldProps) {
  const parts = React.useMemo(() => parseDateTimeInput(value), [value])
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState(() => {
    const base = parts ?? nowParts()
    return { year: base.year, month: base.month }
  })
  const [hourText, setHourText] = React.useState(() =>
    parts ? pad(parts.hour) : "00"
  )
  const [minuteText, setMinuteText] = React.useState(() =>
    parts ? pad(parts.minute) : "00"
  )
  const gridRef = React.useRef<HTMLDivElement>(null)
  // 方向键移动到上/下月时，等新月份渲染完再落焦点
  const pendingFocus = React.useRef<string | null>(null)

  // 外部值变化（回填 URL、重置）时同步时分输入；本地输入不回写，避免光标跳动
  React.useEffect(() => {
    if (!parts) return
    setHourText((current) =>
      Number(current) === parts.hour ? current : pad(parts.hour)
    )
    setMinuteText((current) =>
      Number(current) === parts.minute ? current : pad(parts.minute)
    )
  }, [parts])

  const dateKey = parts
    ? `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
    : ""
  const cells = React.useMemo(
    () => buildMonthCells(view.year, view.month),
    [view]
  )
  const today = todayKey()

  React.useEffect(() => {
    const key = pendingFocus.current
    if (!key) return
    const button = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-date="${key}"]`
    )
    if (!button) return
    button.focus()
    pendingFocus.current = null
  }, [cells])

  // 日历只保留一个 Tab 落点，进入后用方向键移动
  const focusableDate = cells.some((cell) => cell.date === dateKey)
    ? dateKey
    : cells.some((cell) => cell.date === today)
      ? today
      : (cells.find((cell) => cell.inMonth)?.date ?? cells[0].date)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      const base = parts ?? nowParts()
      setView({ year: base.year, month: base.month })
    }
  }

  function shiftMonth(step: number) {
    setView((current) => {
      const index = current.year * 12 + (current.month - 1) + step
      return { year: Math.floor(index / 12), month: (index % 12) + 1 }
    })
  }

  function emitTime(hour: number, minute: number) {
    const base = parts ?? { ...nowParts(), hour: 0, minute: 0 }
    onChange(toDateTimeInput({ ...base, hour, minute }))
  }

  function selectDay(date: string) {
    const [year, month, day] = date.split("-").map(Number)
    // 还没选过时间时默认整天起点，避免出现当前时刻这种意外值
    onChange(
      toDateTimeInput({
        year,
        month,
        day,
        hour: parts?.hour ?? 0,
        minute: parts?.minute ?? 0,
      })
    )
    if (!parts) {
      setHourText("00")
      setMinuteText("00")
    }
    setView({ year, month })
  }

  function commitTime(kind: "hour" | "minute", raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 2)
    if (kind === "hour") setHourText(digits)
    else setMinuteText(digits)
    if (digits === "") return

    const max = kind === "hour" ? 23 : 59
    const next = clamp(Number(digits), 0, max)
    if (kind === "hour") {
      emitTime(next, parts?.minute ?? 0)
    } else {
      emitTime(parts?.hour ?? 0, next)
    }
  }

  // 失焦时补齐两位并提交：否则输入框显示 00、真实值仍是 08:30
  function blurTime(kind: "hour" | "minute") {
    const raw = kind === "hour" ? hourText : minuteText
    const max = kind === "hour" ? 23 : 59
    const next = clamp(Number(raw || 0), 0, max)
    if (kind === "hour") setHourText(pad(next))
    else setMinuteText(pad(next))

    // 没有任何值、也没输入过：不要凭空生成时间和日期
    if (!parts && raw === "") return
    const committed = parts
      ? kind === "hour"
        ? parts.hour
        : parts.minute
      : null
    if (next === committed) return

    if (kind === "hour") emitTime(next, parts?.minute ?? 0)
    else emitTime(parts?.hour ?? 0, next)
  }

  function handleGridKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = ARROW_STEPS[event.key]
    if (!step) return
    const current = (event.target as HTMLElement).dataset.date
    if (!current) return
    event.preventDefault()

    const [year, month, day] = current.split("-").map(Number)
    const next = new Date(year, month - 1, day + step)
    const key = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`
    const button = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-date="${key}"]`
    )
    if (button) {
      button.focus()
      return
    }
    pendingFocus.current = key
    setView({ year: next.getFullYear(), month: next.getMonth() + 1 })
  }

  function setNow() {
    const now = nowParts()
    onChange(toDateTimeInput(now))
    setView({ year: now.year, month: now.month })
    setHourText(pad(now.hour))
    setMinuteText(pad(now.minute))
  }

  function clear() {
    onChange("")
    setHourText("00")
    setMinuteText("00")
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={value} />}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            className={cn(
              inputClassName,
              "flex items-center justify-between gap-2 text-left",
              !value && "text-muted-foreground",
              className
            )}
            {...a11y}
          >
            <span className="truncate tabular-nums">
              {value ? formatDateTimeInput(value) : placeholder}
            </span>
            <CalendarIcon
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-[17.5rem] p-3 [@media(pointer:coarse)]:w-[22rem]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="上个月"
                onClick={() => shiftMonth(-1)}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:size-9"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <span className="text-sm font-medium tabular-nums">
                {formatMonthLabel(view.year, view.month)}
              </span>
              <button
                type="button"
                aria-label="下个月"
                onClick={() => shiftMonth(1)}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:size-9"
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-7">
              {WEEKDAYS.map((label) => (
                <span
                  key={label}
                  className="flex h-7 items-center justify-center text-xs text-muted-foreground"
                >
                  {label}
                </span>
              ))}
            </div>

            <div
              ref={gridRef}
              role="group"
              aria-label="选择日期"
              onKeyDown={handleGridKeyDown}
              className="grid grid-cols-7 gap-y-0.5 [@media(pointer:coarse)]:gap-y-1"
            >
              {cells.map((cell) => {
                const selected = cell.date === dateKey
                const isToday = cell.date === today
                return (
                  <button
                    key={cell.date}
                    type="button"
                    data-date={cell.date}
                    tabIndex={cell.date === focusableDate ? 0 : -1}
                    aria-pressed={selected}
                    aria-label={cell.date}
                    onClick={() => selectDay(cell.date)}
                    className={cn(
                      "mx-auto flex size-8 items-center justify-center rounded-md text-sm tabular-nums transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:size-11",
                      !cell.inMonth && "text-muted-foreground",
                      selected &&
                        "bg-primary text-primary-foreground hover:bg-primary",
                      !selected &&
                        isToday &&
                        "font-medium text-primary ring-1 ring-primary/40 ring-inset"
                    )}
                  >
                    {cell.day}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2 border-t pt-2.5">
              <span className="text-xs text-muted-foreground">时间</span>
              <input
                aria-label="小时"
                inputMode="numeric"
                autoComplete="off"
                value={hourText}
                onChange={(event) => commitTime("hour", event.target.value)}
                onBlur={() => blurTime("hour")}
                className="h-7 w-10 rounded-md border border-input bg-transparent text-center text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:h-10 [@media(pointer:coarse)]:w-12"
              />
              <span className="text-sm text-muted-foreground">:</span>
              <input
                aria-label="分钟"
                inputMode="numeric"
                autoComplete="off"
                value={minuteText}
                onChange={(event) => commitTime("minute", event.target.value)}
                onBlur={() => blurTime("minute")}
                className="h-7 w-10 rounded-md border border-input bg-transparent text-center text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:h-10 [@media(pointer:coarse)]:w-12"
              />
              <button
                type="button"
                onClick={setNow}
                className="ml-auto rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:px-3"
              >
                此刻
              </button>
            </div>

            <div className="flex items-center justify-between border-t pt-2">
              <button
                type="button"
                onClick={clear}
                disabled={!value}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:px-3"
              >
                <XIcon className="size-3.5" />
                清除
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:px-4"
              >
                完成
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}

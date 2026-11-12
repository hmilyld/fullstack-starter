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
  type DateTimeParts,
} from "@/lib/date-time"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"]
const PLACEHOLDER = "选择日期时间"

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

  function emit(next: DateTimeParts) {
    onChange(toDateTimeInput(next))
  }

  function selectDay(date: string) {
    const [year, month, day] = date.split("-").map(Number)
    // 还没选过时间时默认整天起点，避免出现当前时刻这种意外值
    emit({
      year,
      month,
      day,
      hour: parts?.hour ?? 0,
      minute: parts?.minute ?? 0,
    })
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

    const base = parts ?? {
      ...nowParts(),
      hour: 0,
      minute: 0,
    }
    const max = kind === "hour" ? 23 : 59
    const next = clamp(Number(digits), 0, max)
    emit({
      ...base,
      hour: kind === "hour" ? next : base.hour,
      minute: kind === "minute" ? next : base.minute,
    })
  }

  function blurTime(kind: "hour" | "minute") {
    const current = kind === "hour" ? hourText : minuteText
    const max = kind === "hour" ? 23 : 59
    const padded = pad(clamp(Number(current || 0), 0, max))
    if (kind === "hour") setHourText(padded)
    else setMinuteText(padded)
  }

  function setNow() {
    const now = nowParts()
    emit(now)
    setView({ year: now.year, month: now.month })
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

        <PopoverContent className="w-[17.5rem] p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="上个月"
                onClick={() => shiftMonth(-1)}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
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

            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((cell) => {
                const selected = cell.date === dateKey
                const isToday = cell.date === today
                return (
                  <button
                    key={cell.date}
                    type="button"
                    aria-pressed={selected}
                    aria-label={cell.date}
                    onClick={() => selectDay(cell.date)}
                    className={cn(
                      "mx-auto flex size-8 items-center justify-center rounded-md text-sm tabular-nums transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
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
                className="h-7 w-10 rounded-md border border-input bg-transparent text-center text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="text-sm text-muted-foreground">:</span>
              <input
                aria-label="分钟"
                inputMode="numeric"
                autoComplete="off"
                value={minuteText}
                onChange={(event) => commitTime("minute", event.target.value)}
                onBlur={() => blurTime("minute")}
                className="h-7 w-10 rounded-md border border-input bg-transparent text-center text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={setNow}
                className="ml-auto rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                此刻
              </button>
            </div>

            <div className="flex items-center justify-between border-t pt-2">
              <button
                type="button"
                onClick={clear}
                disabled={!value}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                <XIcon className="size-3.5" />
                清除
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
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

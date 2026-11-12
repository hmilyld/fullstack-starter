/** 日期时间控件共用的解析与格式化，值格式固定为 `YYYY-MM-DDTHH:mm` */

export type DateTimeParts = {
  year: number
  /** 1-12 */
  month: number
  day: number
  hour: number
  minute: number
}

export type MonthCell = {
  /** `YYYY-MM-DD` */
  date: string
  day: number
  /** 是否属于当前月 */
  inMonth: boolean
}

const pad = (value: number) => String(value).padStart(2, "0")

const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/

/** 解析 `YYYY-MM-DDTHH:mm`，无法解析时返回 null */
export function parseDateTimeInput(value: string): DateTimeParts | null {
  const match = DATE_TIME.exec(value)
  if (!match) return null
  const [, year, month, day, hour = "0", minute = "0"] = match
  const parts: DateTimeParts = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  }
  if (parts.month < 1 || parts.month > 12) return null
  if (parts.day < 1 || parts.day > daysInMonth(parts.year, parts.month)) {
    return null
  }
  return parts
}

/** 组合为控件值 `YYYY-MM-DDTHH:mm` */
export function toDateTimeInput(parts: DateTimeParts) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`
}

/** 展示用：`2026-11-12 08:30` */
export function formatDateTimeInput(value: string) {
  const parts = parseDateTimeInput(value)
  if (!parts) return value
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}`
}

/** 展示用：`2026 年 11 月` */
export function formatMonthLabel(year: number, month: number) {
  return `${year} 年 ${month} 月`
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

/** 某一月的 42 个日历格（周一起始），含补位的上/下月日期 */
export function buildMonthCells(year: number, month: number): MonthCell[] {
  const first = new Date(year, month - 1, 1)
  // getDay(): 0 是周日，换算成周一为 0
  const offset = (first.getDay() + 6) % 7
  const start = new Date(year, month - 1, 1 - offset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + index
    )
    return {
      date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      day: date.getDate(),
      inMonth: date.getMonth() === month - 1,
    }
  })
}

/** 近 42 天里的今天，返回 `YYYY-MM-DD` */
export function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** 当前时刻 */
export function nowParts(): DateTimeParts {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
  }
}

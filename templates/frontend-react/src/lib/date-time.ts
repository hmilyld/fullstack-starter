/** 日期时间控件共用的解析与格式化，值格式固定为 `YYYY-MM-DDTHH:mm` */

export type DateTimeLocale = "zh-CN" | "en"

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
  if (parts.hour < 0 || parts.hour > 23) return null
  if (parts.minute < 0 || parts.minute > 59) return null
  return parts
}

/** 组合为控件值 `YYYY-MM-DDTHH:mm` */
export function toDateTimeInput(parts: DateTimeParts) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`
}

/** 展示用：中文为 `2026/11/12 08:30`，与表格、筛选 chip 的分隔符一致 */
export function formatDateTimeInput(
  value: string,
  locale: DateTimeLocale = "zh-CN"
) {
  const parts = parseDateTimeInput(value)
  if (!parts) return value
  if (locale === "zh-CN") {
    return `${parts.year}/${pad(parts.month)}/${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}`
  }
  const date = new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute
  )
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(", ", " ")
}

/** 展示用：中文为 `2026 年 11 月`，英文为 `November 2026` */
export function formatMonthLabel(
  year: number,
  month: number,
  locale: DateTimeLocale = "zh-CN"
) {
  if (locale === "zh-CN") return `${year} 年 ${month} 月`
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, 1))
}

const CHINESE_WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"]

/** 周一起始的星期表头；中文保持单字，英文使用 Intl 的短名称 */
export function weekdayLabels(locale: DateTimeLocale = "zh-CN") {
  if (locale === "zh-CN") return CHINESE_WEEKDAYS
  // 2024-01-01 是周一
  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
      new Date(2024, 0, 1 + index)
    )
  )
}

/** 日历格子的完整日期文案（含星期），供读屏朗读 */
export function formatDayLabel(
  dateKey: string,
  locale: DateTimeLocale = "zh-CN"
) {
  const [year, month, day] = dateKey.split("-").map(Number)
  if (!year || !month || !day) return dateKey
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)))
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

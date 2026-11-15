/** 表格、审计日志等场景共用的时间格式 */
export function formatDateTime(value: string, locale = "zh-CN") {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(locale, { hour12: false })
}

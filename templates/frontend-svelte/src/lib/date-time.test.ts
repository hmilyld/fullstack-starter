import { describe, expect, it } from "vitest"

import {
  buildMonthCells,
  daysInMonth,
  formatDateTimeInput,
  formatMonthLabel,
  parseDateTimeInput,
  toDateTimeInput,
} from "./date-time"

describe("parseDateTimeInput", () => {
  it("解析分钟精度的值", () => {
    expect(parseDateTimeInput("2026-11-12T08:30")).toEqual({
      year: 2026,
      month: 11,
      day: 12,
      hour: 8,
      minute: 30,
    })
  })

  it("忽略秒", () => {
    expect(parseDateTimeInput("2026-11-12T08:30:00")).toMatchObject({
      hour: 8,
      minute: 30,
    })
  })

  it("拒绝空值、非法月份和越界日期", () => {
    expect(parseDateTimeInput("")).toBeNull()
    expect(parseDateTimeInput("2026-13-01T08:30")).toBeNull()
    expect(parseDateTimeInput("2026-02-30T08:30")).toBeNull()
    expect(parseDateTimeInput("2026-11-12T24:00")).toBeNull()
    expect(parseDateTimeInput("2026-11-12T08:60")).toBeNull()
  })
})

describe("toDateTimeInput", () => {
  it("补零成控件值", () => {
    expect(
      toDateTimeInput({
        year: 2026,
        month: 1,
        day: 5,
        hour: 7,
        minute: 4,
      })
    ).toBe("2026-01-05T07:04")
  })
})

describe("formatDateTimeInput", () => {
  it("展示为与表格一致的斜杠日期", () => {
    expect(formatDateTimeInput("2026-11-12T08:30")).toBe("2026/11/12 08:30")
  })

  it("无法解析时原样返回", () => {
    expect(formatDateTimeInput("2026/11/12")).toBe("2026/11/12")
    expect(formatDateTimeInput("")).toBe("")
  })
})

describe("buildMonthCells", () => {
  it("始终返回 6 行 42 格，且从周一开始", () => {
    const cells = buildMonthCells(2026, 11)
    expect(cells).toHaveLength(42)
    expect(cells[0].date).toBe("2026-10-26")
    expect(cells[41].date).toBe("2026-12-06")
  })

  it("标记补位的上/下月日期", () => {
    const cells = buildMonthCells(2026, 11)
    const inMonth = cells.filter((cell) => cell.inMonth)
    expect(inMonth).toHaveLength(daysInMonth(2026, 11))
    expect(inMonth[0].date).toBe("2026-11-01")
    expect(cells[0].inMonth).toBe(false)
  })

  it("闰年二月有 29 天", () => {
    expect(daysInMonth(2024, 2)).toBe(29)
    expect(
      buildMonthCells(2024, 2).filter((cell) => cell.inMonth)
    ).toHaveLength(29)
  })
})

describe("formatMonthLabel", () => {
  it("输出中文年月", () => {
    expect(formatMonthLabel(2026, 11)).toBe("2026 年 11 月")
  })
})

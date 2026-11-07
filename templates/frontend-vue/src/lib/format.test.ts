import { describe, expect, it } from "vitest"
import { formatDateTime } from "./format"

describe("formatDateTime", () => {
  it("returns a placeholder for empty values", () => {
    expect(formatDateTime("")).toBe("-")
  })

  it("keeps invalid values untouched", () => {
    expect(formatDateTime("not-a-date")).toBe("not-a-date")
  })

  it("formats valid timestamps", () => {
    const value = formatDateTime("2026-11-07T12:00:00Z")
    expect(value).not.toBe("-")
    expect(value).toContain("2026")
  })
})

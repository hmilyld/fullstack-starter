import { describe, expect, it } from "vitest"

import { formatDateTime } from "./format"

describe("formatDateTime", () => {
  it("returns a dash for empty values", () => {
    expect(formatDateTime("")).toBe("-")
  })

  it("returns the original value when it cannot be parsed", () => {
    expect(formatDateTime("not-a-date")).toBe("not-a-date")
  })

  it("formats a valid ISO timestamp", () => {
    const result = formatDateTime("2026-11-07T12:00:00Z")
    expect(result).toContain("2026")
    expect(result).not.toBe("2026-11-07T12:00:00Z")
  })
})

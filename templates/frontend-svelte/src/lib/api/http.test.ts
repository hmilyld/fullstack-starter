import { describe, expect, it } from "vitest"

import { buildUrl, parseFilename } from "./http.js"

describe("buildUrl", () => {
  it("returns the bare path when there are no params", () => {
    expect(buildUrl("/users")).toBe("/users")
    expect(buildUrl("/users", {})).toBe("/users")
  })

  it("appends defined params and skips empty ones", () => {
    expect(buildUrl("/users", { search: "a", page: 2 })).toBe(
      "/users?search=a&page=2"
    )
    expect(buildUrl("/users", { search: "", page: undefined })).toBe("/users")
  })

  it("keeps boolean false, which is a meaningful filter value", () => {
    expect(buildUrl("/ai-models", { isActive: false })).toBe(
      "/ai-models?isActive=false"
    )
  })
})

describe("parseFilename", () => {
  it("prefers the RFC 5987 filename* form", () => {
    expect(
      parseFilename(
        `attachment; filename="a.zip"; filename*=UTF-8''%E6%95%B0%E6%8D%AE.zip`
      )
    ).toBe("数据.zip")
  })

  it("falls back to the plain filename", () => {
    expect(parseFilename('attachment; filename="backup.sql"')).toBe(
      "backup.sql"
    )
  })

  it("returns the raw value when the name cannot be decoded", () => {
    expect(parseFilename('attachment; filename="100%report.zip"')).toBe(
      "100%report.zip"
    )
  })

  it("returns an empty string when the header is missing", () => {
    expect(parseFilename(null)).toBe("")
    expect(parseFilename("")).toBe("")
  })

  it("returns an empty string when the header has no filename", () => {
    expect(parseFilename("attachment")).toBe("")
  })
})

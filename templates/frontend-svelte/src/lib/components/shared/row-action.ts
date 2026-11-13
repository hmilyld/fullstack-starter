import type { Component } from "svelte"

export type RowAction = {
  label: string
  icon?: Component
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
  separatorBefore?: boolean
}

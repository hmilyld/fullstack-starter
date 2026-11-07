import type { Component } from "vue"

export type RowAction = {
  label: string
  icon?: Component
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
  separatorBefore?: boolean
}

import { getContext, setContext } from "svelte"

const DROPDOWN_TRIGGER_KEY = Symbol("dropdown-menu-trigger")

/**
 * 触发器的元素引用。bits-ui 不把 triggerNode 暴露给 content，而关闭菜单时
 * 又需要它来恢复焦点（sticky 顶栏里的触发器不能用普通 focus，会把页面滚回顶部）。
 * root 常驻，所以由 root 提供、trigger 写入、content 读取，避免依赖挂载与焦点时序。
 */
export type DropdownTriggerContext = {
  current: HTMLElement | null
}

export function setDropdownTriggerContext(): DropdownTriggerContext {
  return setContext(DROPDOWN_TRIGGER_KEY, { current: null })
}

export function getDropdownTriggerContext():
  DropdownTriggerContext | undefined {
  return getContext(DROPDOWN_TRIGGER_KEY)
}

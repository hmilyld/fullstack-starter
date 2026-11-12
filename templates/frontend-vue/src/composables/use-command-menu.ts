import { ref } from "vue"

const open = ref(false)

/** 顶栏、侧边栏底部与快捷键共用的命令面板入口 */
export function openCommandMenu() {
  open.value = true
}

export function useCommandMenu() {
  return { open, openCommandMenu }
}

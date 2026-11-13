let open = $state(false)

/** 顶栏、侧边栏底部与快捷键共用的命令面板入口 */
export function openCommandMenu() {
  open = true
}

export function closeCommandMenu() {
  open = false
}

export function useCommandMenu() {
  return {
    get open() {
      return open
    },
    setOpen(value: boolean) {
      open = value
    },
    openCommandMenu,
    closeCommandMenu,
  }
}

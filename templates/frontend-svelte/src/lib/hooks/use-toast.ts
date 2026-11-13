import { toast } from "svelte-sonner"

/** 统一提示入口，底层使用 svelte-sonner，保持与 React/Vue 模板一致的交互 */
export function useToast() {
  return {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    info: (message: string) => toast.info(message),
    warning: (message: string) => toast.warning(message),
    message: (message: string) => toast(message),
  }
}

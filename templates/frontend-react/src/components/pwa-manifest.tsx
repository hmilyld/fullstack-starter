import { usePwaManifest } from "@/hooks/use-pwa-manifest"

/** 挂载时把站点配置同步到 PWA manifest，不渲染任何 UI */
export function PwaManifest() {
  usePwaManifest()
  return null
}

import { Spinner } from "@/components/ui/spinner"

/** 路由懒加载/首次水合时的整页加载态 */
export function FullPageLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Spinner className="size-6" />
    </div>
  )
}

import { Link } from "react-router"
import { CompassIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <EmptyState
        className="max-w-lg"
        icon={CompassIcon}
        title="页面不存在"
        description="地址可能已更改，或者您没有访问该页面的权限。"
        action={
          <Button asChild>
            <Link to="/dashboard">返回仪表盘</Link>
          </Button>
        }
      />
    </div>
  )
}

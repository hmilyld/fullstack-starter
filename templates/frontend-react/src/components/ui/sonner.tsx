import type { CSSProperties } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import { useMediaQuery } from "@/hooks/use-media-query"

function Toaster({ ...props }: ToasterProps) {
  const { theme } = useTheme()
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)")
  // 语义色写在 index.css（按 data-sonner-theme 区分深浅），这里只传解析后的主题
  const resolvedTheme =
    theme === "system" ? (prefersDark ? "dark" : "light") : theme

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--border-radius": "var(--radius)",
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }

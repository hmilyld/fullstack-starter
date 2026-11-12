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

function Toaster({ ...props }: ToasterProps) {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme}
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
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg":
            "color-mix(in oklch, var(--success) 12%, var(--popover))",
          "--success-border":
            "color-mix(in oklch, var(--success) 28%, var(--popover))",
          "--success-text": "var(--success)",
          "--error-bg":
            "color-mix(in oklch, var(--destructive) 10%, var(--popover))",
          "--error-border":
            "color-mix(in oklch, var(--destructive) 26%, var(--popover))",
          "--error-text": "var(--destructive)",
          "--warning-bg":
            "color-mix(in oklch, var(--warning) 14%, var(--popover))",
          "--warning-border":
            "color-mix(in oklch, var(--warning) 30%, var(--popover))",
          "--warning-text": "var(--warning)",
          "--info-bg": "color-mix(in oklch, var(--info) 12%, var(--popover))",
          "--info-border":
            "color-mix(in oklch, var(--info) 28%, var(--popover))",
          "--info-text": "var(--info)",
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }

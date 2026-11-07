import { cn } from "@/lib/utils"

/** 品牌标记：侧边栏与登录页共用 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-8 shrink-0", className)}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M8 12h6v2H8v-2zm0 4h10v2H8v-2zm0 4h8v2H8v-2z"
        className="fill-primary-foreground"
      />
      <rect
        x="18"
        y="10"
        width="8"
        height="8"
        rx="2"
        className="fill-primary-foreground"
        fillOpacity="0.8"
      />
      <path
        d="M20 13h4M20 15.5h4"
        stroke="currentColor"
        strokeWidth="1.2"
        className="stroke-primary"
        strokeLinecap="round"
      />
    </svg>
  )
}

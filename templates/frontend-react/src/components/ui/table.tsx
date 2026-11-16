import * as React from "react"

import { cn } from "@/lib/utils"

function Table({
  className,
  sticky = false,
  label,
  scrollable = true,
  children,
  ...props
}: React.ComponentProps<"table"> & {
  /** 表头吸顶：桌面端容器不再横向滚动，交由列优先级控制宽度 */
  sticky?: boolean
  /** 表格的无障碍名称，同时用作 sr-only caption 与滚动区域的 aria-label */
  label?: string
  /** 容器是否可能横向滚动；为 true 且提供了 label 时，容器可被键盘聚焦 */
  scrollable?: boolean
}) {
  // 滚动的表格必须能接收键盘焦点，否则键盘用户无法横向滚动（WCAG 2.1.1）
  const namedRegion = scrollable && Boolean(label)

  return (
    <div
      data-slot="table-container"
      role={namedRegion ? "region" : undefined}
      aria-label={namedRegion ? label : undefined}
      tabIndex={namedRegion ? 0 : undefined}
      className={cn(
        "relative w-full overflow-x-auto",
        // sticky 表头要求容器不是滚动容器：桌面端宽度由优先列保证不溢出
        sticky && "md:overflow-x-visible",
        namedRegion && "focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      >
        {label && <caption className="sr-only">{label}</caption>}
        {children}
      </table>
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      scope="col"
      className={cn(
        "h-11 px-4 text-left align-middle text-[13px] font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

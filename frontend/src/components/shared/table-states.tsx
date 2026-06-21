import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table"

export function TableSkeletonRow({ colSpan = 5 }: { colSpan?: number }) {
  return (
    <Table>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: colSpan }).map((_, j) => (
              <TableCell key={j}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function PageFormSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TableCardSkeleton({ colSpan = 5 }: { colSpan?: number }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <TableSkeletonRow colSpan={colSpan} />
      </div>
    </div>
  )
}

export function TableEmptyRow({ colSpan = 5, text = "暂无数据" }: { colSpan?: number; text?: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
        {text}
      </TableCell>
    </TableRow>
  )
}

import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

export function TableSkeletonRow({ colSpan = 5 }: { colSpan?: number }) {
  return (
    <Table>
      <TableBody>
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: colSpan }).map((_, columnIndex) => (
              <TableCell key={columnIndex}>
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
    <div className="flex flex-col gap-(--page-gap)">
      <Skeleton className="h-8 w-56" />
      <div className="flex flex-col gap-(--page-gap) rounded-[min(var(--radius-4xl),24px)] bg-card p-5 ring-1 ring-foreground/5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

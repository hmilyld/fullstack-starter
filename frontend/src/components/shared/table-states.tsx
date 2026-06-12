import { Spinner } from "@/components/ui/spinner"
import { TableRow, TableCell } from "@/components/ui/table"

export function TableLoadingRow({ colSpan = 5 }: { colSpan?: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Spinner />加载中...
        </div>
      </TableCell>
    </TableRow>
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

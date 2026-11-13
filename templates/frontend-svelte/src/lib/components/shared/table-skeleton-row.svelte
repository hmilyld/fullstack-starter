<script lang="ts">
  import { Skeleton } from "#lib/components/ui/skeleton/index.js"
  import {
    Table,
    TableBody,
    TableCell,
    TableRow,
  } from "#lib/components/ui/table/index.js"

  let { colSpan = 5 }: { colSpan?: number } = $props()
</script>

<Table>
  <TableBody>
    {#each Array(5) as _, rowIndex (rowIndex)}
      <TableRow>
        {#each Array(colSpan) as _, columnIndex (columnIndex)}
          <TableCell><Skeleton class="h-4 w-full" /></TableCell>
        {/each}
      </TableRow>
    {/each}
  </TableBody>
</Table>

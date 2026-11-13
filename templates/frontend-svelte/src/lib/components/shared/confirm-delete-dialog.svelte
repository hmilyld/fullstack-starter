<script lang="ts">
  import { Spinner } from "#lib/components/ui/spinner/index.js"
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "#lib/components/ui/alert-dialog/index.js"

  let {
    open = $bindable(false),
    targetName,
    description,
    loading = false,
    onConfirm,
  }: {
    open?: boolean
    targetName: string
    description?: string
    loading?: boolean
    onConfirm: () => void
  } = $props()
</script>

<AlertDialog bind:open>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>确认删除</AlertDialogTitle>
      <AlertDialogDescription>
        确定要删除
        <span class="font-medium text-foreground">{targetName}</span>
        吗？此操作不可撤销。
        {#if description}
          {description}{/if}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>取消</AlertDialogCancel>
      <AlertDialogAction
        variant="destructive"
        disabled={loading}
        onclick={(event) => {
          event.preventDefault()
          onConfirm()
        }}
      >
        {#if loading}<Spinner data-icon="inline-start" />{/if}
        删除
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

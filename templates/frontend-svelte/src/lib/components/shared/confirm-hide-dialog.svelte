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
    loading = false,
    onConfirm,
  }: {
    open?: boolean
    targetName: string
    loading?: boolean
    onConfirm: () => void
  } = $props()
</script>

<AlertDialog bind:open>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>确认隐藏菜单</AlertDialogTitle>
      <AlertDialogDescription>
        隐藏
        <span class="font-medium text-foreground">{targetName}</span>
        后，侧边栏将不再显示该入口。如果这是「菜单与权限」或「系统设置」入口，你仍可通过
        /settings/menu 直接访问并重新显示。
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>取消</AlertDialogCancel>
      <AlertDialogAction
        disabled={loading}
        onclick={(event) => {
          event.preventDefault()
          onConfirm()
        }}
      >
        {#if loading}<Spinner data-icon="inline-start" />{/if}
        隐藏
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

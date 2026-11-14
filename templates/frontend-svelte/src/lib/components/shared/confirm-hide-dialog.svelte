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
  import { t } from "#lib/i18n.js"

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
      <AlertDialogTitle>{$t("common.confirmHide.title")}</AlertDialogTitle>
      <AlertDialogDescription>
        {$t("common.confirmHide.prefix")}
        <span class="font-medium text-foreground">{targetName}</span>
        {$t("common.confirmHide.suffix")}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{$t("common.confirmHide.cancel")}</AlertDialogCancel>
      <AlertDialogAction
        disabled={loading}
        onclick={(event) => {
          event.preventDefault()
          onConfirm()
        }}
      >
        {#if loading}<Spinner data-icon="inline-start" />{/if}
        {$t("common.confirmHide.confirm")}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

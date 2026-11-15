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
      <AlertDialogTitle>{$t("common.confirmDelete.title")}</AlertDialogTitle>
      <AlertDialogDescription>
        {$t("common.confirmDelete.prefix")}
        <span class="font-medium text-foreground">{targetName}</span>
        {$t("common.confirmDelete.suffix")}
        {#if description}
          {description}{/if}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{$t("common.confirmDelete.cancel")}</AlertDialogCancel>
      <AlertDialogAction
        variant="destructive"
        disabled={loading}
        onclick={(event) => {
          event.preventDefault()
          onConfirm()
        }}
      >
        {#if loading}<Spinner data-icon="inline-start" />{/if}
        {$t("common.confirmDelete.confirm")}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

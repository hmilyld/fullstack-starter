<script lang="ts">
  import type { Snippet } from "svelte"
  import LoadingButton from "#lib/components/shared/loading-button.svelte"
  import { Button } from "#lib/components/ui/button/index.js"
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "#lib/components/ui/dialog/index.js"
  import { t } from "#lib/i18n.js"
  import { cn } from "#lib/utils.js"

  let {
    open = $bindable(false),
    title,
    description,
    submitting = false,
    submitLabel,
    cancelLabel,
    onSubmit,
    children,
    class: className,
  }: {
    open?: boolean
    title: string
    description?: string
    submitting?: boolean
    submitLabel?: string
    cancelLabel?: string
    onSubmit: (event: SubmitEvent) => void
    children?: Snippet
    class?: string
  } = $props()
</script>

<Dialog bind:open>
  <DialogContent
    class={cn(
      "flex max-h-[calc(100dvh-var(--dialog-inset)*2)] flex-col gap-0 overflow-hidden p-0",
      className
    )}
  >
    <form
      class="flex min-h-0 flex-1 flex-col"
      onsubmit={(event) => {
        event.preventDefault()
        onSubmit(event)
      }}
    >
      <DialogHeader class="border-b p-4 pr-14 md:p-6 md:pr-14">
        <DialogTitle>{title}</DialogTitle>
        {#if description}
          <DialogDescription>{description}</DialogDescription>
        {/if}
      </DialogHeader>
      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
        {@render children?.()}
      </div>
      <DialogFooter class="flex-row justify-end border-t bg-popover p-4 md:p-6">
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onclick={() => (open = false)}
        >
          {cancelLabel ?? $t("common.cancel")}
        </Button>
        <LoadingButton type="submit" loading={submitting}>
          {submitLabel ?? $t("common.save")}
        </LoadingButton>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>

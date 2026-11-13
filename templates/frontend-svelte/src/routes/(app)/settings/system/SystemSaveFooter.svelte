<script lang="ts">
  import { Save } from "@lucide/svelte"
  import LoadingButton from "#lib/components/shared/loading-button.svelte"
  import { CardFooter } from "#lib/components/ui/card/index.js"

  let {
    dirty,
    loading,
    label,
    onSave,
  }: {
    dirty: boolean
    loading: boolean
    label: string
    onSave: () => void
  } = $props()
</script>

<CardFooter class="flex flex-wrap items-center gap-3">
  <LoadingButton
    {loading}
    disabled={!dirty}
    class="w-full md:w-auto"
    onclick={onSave}
  >
    <Save data-icon="inline-start" />
    {label}
  </LoadingButton>
  <span class="text-xs text-muted-foreground">
    {dirty ? "有未保存的修改" : "已保存"}
  </span>
</CardFooter>

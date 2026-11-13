<script lang="ts">
  import { CircleAlert, RefreshCw } from "@lucide/svelte"
  import EmptyState from "#lib/components/shared/empty-state.svelte"
  import { Button } from "#lib/components/ui/button/index.js"

  let { message, onRetry }: { message: string; onRetry: () => void } = $props()
</script>

<EmptyState icon={CircleAlert} title="加载失败" description={message}>
  <!-- eslint-disable-next-line svelte/no-useless-children-snippet -->
  {#snippet children()}
    <Button variant="outline" onclick={onRetry}>
      <RefreshCw data-icon="inline-start" />
      重试
    </Button>
  {/snippet}
</EmptyState>

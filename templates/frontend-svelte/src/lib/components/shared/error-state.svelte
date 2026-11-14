<script lang="ts">
  import { CircleAlert, RefreshCw } from "@lucide/svelte"
  import EmptyState from "#lib/components/shared/empty-state.svelte"
  import { Button } from "#lib/components/ui/button/index.js"
  import { t } from "#lib/i18n.js"

  let { message, onRetry }: { message: string; onRetry: () => void } = $props()
</script>

<EmptyState
  icon={CircleAlert}
  title={$t("common.loadFailed")}
  description={message}
>
  <!-- eslint-disable-next-line svelte/no-useless-children-snippet -->
  {#snippet children()}
    <Button variant="outline" onclick={onRetry}>
      <RefreshCw data-icon="inline-start" />
      {$t("common.retry")}
    </Button>
  {/snippet}
</EmptyState>

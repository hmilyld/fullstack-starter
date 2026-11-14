<script lang="ts">
  import { TriangleAlert } from "@lucide/svelte"
  import EmptyState from "#lib/components/shared/empty-state.svelte"
  import { Button } from "#lib/components/ui/button/index.js"
  import { page } from "$app/state"
  import { t } from "#lib/i18n.js"

  const isNotFound = $derived(page.status === 404)
</script>

<div class="flex min-h-svh items-center justify-center p-6">
  <EmptyState
    class="max-w-lg"
    icon={TriangleAlert}
    title={isNotFound
      ? $t("errors.notFoundTitle")
      : $t("errors.pageLoadFailed")}
    description={isNotFound
      ? $t("errors.notFoundDescription")
      : $t("errors.pageLoadDescription")}
  >
    <!-- eslint-disable-next-line svelte/no-useless-children-snippet -->
    {#snippet children()}
      <Button href="/dashboard">{$t("errors.backToDashboard")}</Button>
    {/snippet}
  </EmptyState>
</div>

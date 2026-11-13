<script lang="ts">
  import { TriangleAlert } from "@lucide/svelte"
  import EmptyState from "#lib/components/shared/empty-state.svelte"
  import { Button } from "#lib/components/ui/button/index.js"
  import { page } from "$app/state"

  const isNotFound = $derived(page.status === 404)
</script>

<div class="flex min-h-svh items-center justify-center p-6">
  <EmptyState
    class="max-w-lg"
    icon={TriangleAlert}
    title={isNotFound ? "页面不存在" : "页面加载失败"}
    description={isNotFound
      ? "你访问的页面可能已被移动或删除。"
      : "页面遇到问题，请返回仪表盘后重试。"}
  >
    <!-- eslint-disable-next-line svelte/no-useless-children-snippet -->
    {#snippet children()}
      <Button href="/dashboard">返回仪表盘</Button>
    {/snippet}
  </EmptyState>
</div>

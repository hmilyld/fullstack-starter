<script lang="ts">
  import AdminLayout from "#lib/components/admin-layout.svelte"
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()
</script>

<AdminLayout>
  {@render children?.()}
</AdminLayout>

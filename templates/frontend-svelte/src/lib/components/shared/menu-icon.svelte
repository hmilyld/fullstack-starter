<script lang="ts">
  import { menuIcons, type MenuIconName } from "#lib/icons.js"

  let { name }: { name: string } = $props()
  const Icon = $derived(menuIcons[name as MenuIconName] ?? menuIcons.circle)
</script>

<Icon />

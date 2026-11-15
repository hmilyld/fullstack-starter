<script lang="ts">
  import { menuIcons, type MenuIconName } from "#lib/icons.js"

  let {
    name,
    class: className,
    ...restProps
  }: {
    name: string
    class?: string
    [key: string]: unknown
  } = $props()
  const Icon = $derived(menuIcons[name as MenuIconName] ?? menuIcons.circle)
</script>

<Icon class={className} aria-hidden="true" {...restProps} />

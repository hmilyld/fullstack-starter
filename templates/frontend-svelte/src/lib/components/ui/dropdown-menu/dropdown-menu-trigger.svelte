<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui"
  import { getDropdownTriggerContext } from "./context.js"

  let {
    ref = $bindable(null),
    ...restProps
  }: DropdownMenuPrimitive.TriggerProps = $props()

  const triggerContext = getDropdownTriggerContext()

  $effect(() => {
    const element = ref
    if (!triggerContext) return
    triggerContext.current = element
    return () => {
      if (triggerContext.current === element) triggerContext.current = null
    }
  })
</script>

<DropdownMenuPrimitive.Trigger
  bind:ref
  data-slot="dropdown-menu-trigger"
  {...restProps}
/>

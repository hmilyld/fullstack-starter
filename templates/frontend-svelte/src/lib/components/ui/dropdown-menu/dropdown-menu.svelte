<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui"
  import { setDropdownTriggerContext } from "./context.js"

  let {
    open = $bindable(false),
    ...restProps
  }: DropdownMenuPrimitive.RootProps = $props()

  setDropdownTriggerContext()
</script>

<DropdownMenuPrimitive.Root bind:open {...restProps} />

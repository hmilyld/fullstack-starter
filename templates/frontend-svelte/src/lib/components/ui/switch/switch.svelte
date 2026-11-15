<script lang="ts">
  import { Switch as SwitchPrimitive } from "bits-ui"
  import { cn, type WithoutChildrenOrChild } from "#lib/utils.js"

  let {
    ref = $bindable(null),
    class: className,
    checked = $bindable(false),
    size = "default",
    ...restProps
  }: WithoutChildrenOrChild<SwitchPrimitive.RootProps> & {
    size?: "sm" | "default"
  } = $props()
</script>

<SwitchPrimitive.Root
  bind:ref
  bind:checked
  data-slot="switch"
  data-size={size}
  class={cn(
    "peer group/switch relative inline-flex shrink-0 items-center rounded-full border-2 transition-colors outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-5 data-[size=default]:w-8 data-[size=sm]:h-4 data-[size=sm]:w-6 max-md:after:-inset-y-3 max-md:data-[size=default]:h-6 max-md:data-[size=default]:w-10 max-md:data-[size=sm]:h-5 max-md:data-[size=sm]:w-8 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-unchecked:border-transparent data-unchecked:bg-input/90 data-disabled:cursor-not-allowed data-disabled:opacity-50 [@media(pointer:coarse)]:after:-inset-y-3 [@media(pointer:coarse)]:data-[size=default]:h-6 [@media(pointer:coarse)]:data-[size=default]:w-10 [@media(pointer:coarse)]:data-[size=sm]:h-5 [@media(pointer:coarse)]:data-[size=sm]:w-8",
    className
  )}
  {...restProps}
>
  <SwitchPrimitive.Thumb
    data-slot="switch-thumb"
    class={cn(
      "pointer-events-none block rounded-full bg-background shadow-sm ring-0 transition-transform not-dark:bg-clip-padding group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%_-_4px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%_-_4px)] dark:data-checked:bg-primary-foreground group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground",
      "rtl:data-[state=checked]:translate-x-[calc(-100%)]"
    )}
  />
</SwitchPrimitive.Root>

<script setup lang="ts">
import type { SwitchRootEmits, SwitchRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { cn } from "@/lib/utils"
import { SwitchRoot, SwitchThumb, useForwardPropsEmits } from "reka-ui"

const props = withDefaults(
  defineProps<
    SwitchRootProps & {
      class?: HTMLAttributes["class"]
      size?: "sm" | "default"
    }
  >(),
  {
    size: "default",
  }
)

const emits = defineEmits<SwitchRootEmits>()

const delegatedProps = reactiveOmit(props, "class", "size")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SwitchRoot
    v-slot="slotProps"
    data-slot="switch"
    :data-size="size"
    v-bind="forwarded"
    :class="
      cn(
        'peer group/switch relative inline-flex shrink-0 items-center rounded-2xl border-2 transition-colors outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-5 data-[size=default]:w-8 data-[size=sm]:h-4 data-[size=sm]:w-6 max-md:after:-inset-y-3 max-md:data-[size=default]:h-6 max-md:data-[size=default]:w-10 max-md:data-[size=sm]:h-5 max-md:data-[size=sm]:w-8 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-unchecked:border-transparent data-unchecked:bg-input/90 data-disabled:cursor-not-allowed data-disabled:opacity-50 [@media(pointer:coarse)]:after:-inset-y-3 [@media(pointer:coarse)]:data-[size=default]:h-6 [@media(pointer:coarse)]:data-[size=default]:w-10 [@media(pointer:coarse)]:data-[size=sm]:h-5 [@media(pointer:coarse)]:data-[size=sm]:w-8',
        props.class
      )
    "
  >
    <SwitchThumb
      data-slot="switch-thumb"
      class="pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] dark:data-checked:bg-primary-foreground group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground"
    >
      <slot name="thumb" v-bind="slotProps" />
    </SwitchThumb>
  </SwitchRoot>
</template>

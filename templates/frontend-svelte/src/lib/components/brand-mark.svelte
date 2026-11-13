<script lang="ts">
  import { cn } from "#lib/utils.js"

  let { class: className }: { class?: string } = $props()
</script>

<svg
  class={cn("size-8 shrink-0", className)}
  viewBox="0 0 32 32"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <rect width="32" height="32" rx="8" class="fill-primary" />
  <path
    d="M8 12h6v2H8v-2zm0 4h10v2H8v-2zm0 4h8v2H8v-2z"
    class="fill-primary-foreground"
  />
  <rect
    x="18"
    y="10"
    width="8"
    height="8"
    rx="2"
    class="fill-primary-foreground"
    fill-opacity="0.8"
  />
  <path
    d="M20 13h4M20 15.5h4"
    stroke="currentColor"
    stroke-width="1.2"
    class="stroke-primary"
    stroke-linecap="round"
  />
</svg>

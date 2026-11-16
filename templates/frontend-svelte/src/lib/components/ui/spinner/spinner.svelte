<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-2"
  import { t } from "#lib/i18n.js"
  import { cn } from "#lib/utils.js"
  import type { SVGAttributes } from "svelte/elements"

  let {
    class: className,
    role = "status",
    /** 放在已有文字或 aria-busy 的控件内时，不要再重复播报 */
    decorative = false,
    // we add name, color, and stroke for compatibility with different icon libraries props.
    // only forward them when set, otherwise `stroke: undefined` overrides the icon's `currentColor`
    name,
    color,
    stroke,
    className: legacyClassName,
    "aria-label": ariaLabel = $t("common.loading"),
    ...restProps
  }: SVGAttributes<SVGSVGElement> & { decorative?: boolean } = $props()

  const resolvedRole = $derived(decorative ? undefined : role)
  const resolvedLabel = $derived(decorative ? undefined : ariaLabel)
</script>

<Loader2Icon
  data-slot="spinner"
  role={resolvedRole}
  aria-hidden={decorative || undefined}
  {...name != null ? { name } : {}}
  {...color != null ? { color } : {}}
  {...stroke != null ? { stroke } : {}}
  {...legacyClassName != null ? { className: legacyClassName } : {}}
  aria-label={resolvedLabel}
  class={cn("size-4 animate-spin", className)}
  {...restProps}
/>

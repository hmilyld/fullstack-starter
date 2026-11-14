<script lang="ts">
  import { Monitor, Moon, Settings2, Sun } from "@lucide/svelte"
  import { Button } from "#lib/components/ui/button/index.js"
  import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "#lib/components/ui/sheet/index.js"
  import {
    useLayoutConfig,
    type SidebarCollapsible,
    type SidebarVariant,
  } from "#lib/hooks/use-layout-config.svelte.js"
  import { t } from "#lib/i18n.js"
  import { getTheme, setTheme } from "#lib/stores/theme.svelte.js"

  type ThemeValue = "light" | "dark" | "system"

  const layout = useLayoutConfig()

  const themes: {
    value: ThemeValue
    label: string
    icon: typeof Sun
  }[] = $derived([
    { value: "light", label: $t("appearance.light"), icon: Sun },
    { value: "dark", label: $t("appearance.dark"), icon: Moon },
    { value: "system", label: $t("appearance.system"), icon: Monitor },
  ])

  const variants: { value: SidebarVariant; label: string }[] = $derived([
    { value: "sidebar", label: $t("appearance.default") },
    { value: "floating", label: $t("appearance.floating") },
    { value: "inset", label: $t("appearance.inset") },
  ])

  const collapsibles: { value: SidebarCollapsible; label: string }[] = $derived(
    [
      { value: "icon", label: $t("appearance.icon") },
      { value: "offcanvas", label: $t("appearance.offcanvas") },
    ]
  )
</script>

<Sheet>
  <SheetTrigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="ghost"
        size="icon-sm"
        aria-label={$t("common.appearance")}
        title={$t("common.appearance")}
      >
        <Settings2 />
      </Button>
    {/snippet}
  </SheetTrigger>
  <SheetContent class="w-80">
    <SheetHeader>
      <SheetTitle>{$t("appearance.title")}</SheetTitle>
      <SheetDescription>{$t("appearance.description")}</SheetDescription>
    </SheetHeader>
    <div class="flex flex-col gap-6 px-4 pb-6">
      <section class="flex flex-col gap-2">
        <h3 class="text-sm font-medium">{$t("appearance.theme")}</h3>
        <div
          class="grid grid-cols-3 gap-2"
          role="group"
          aria-label={$t("appearance.theme")}
        >
          {#each themes as item (item.value)}
            {@const Icon = item.icon}
            <Button
              type="button"
              variant={getTheme() === item.value ? "default" : "outline"}
              aria-pressed={getTheme() === item.value}
              class="h-auto flex-col gap-1.5 px-2 py-3 text-xs"
              onclick={() => setTheme(item.value)}
            >
              <Icon class="size-4" />
              {item.label}
            </Button>
          {/each}
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <h3 class="text-sm font-medium">{$t("appearance.sidebar")}</h3>
        <div
          class="grid grid-cols-3 gap-2"
          role="group"
          aria-label={$t("appearance.sidebar")}
        >
          {#each variants as item (item.value)}
            <Button
              type="button"
              variant={layout.variant === item.value ? "default" : "outline"}
              aria-pressed={layout.variant === item.value}
              class="h-auto flex-col gap-1.5 px-2 py-3 text-xs"
              onclick={() => layout.setVariant(item.value)}
            >
              {item.label}
            </Button>
          {/each}
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <h3 class="text-sm font-medium">{$t("appearance.collapse")}</h3>
        <div
          class="grid grid-cols-3 gap-2"
          role="group"
          aria-label={$t("appearance.collapse")}
        >
          {#each collapsibles as item (item.value)}
            <Button
              type="button"
              variant={layout.collapsible === item.value
                ? "default"
                : "outline"}
              aria-pressed={layout.collapsible === item.value}
              class="h-auto flex-col gap-1.5 px-2 py-3 text-xs"
              onclick={() => layout.setCollapsible(item.value)}
            >
              {item.label}
            </Button>
          {/each}
        </div>
      </section>
    </div>
  </SheetContent>
</Sheet>

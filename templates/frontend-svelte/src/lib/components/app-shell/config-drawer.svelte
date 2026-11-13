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
  import { getTheme, setTheme } from "#lib/stores/theme.svelte.js"

  type ThemeValue = "light" | "dark" | "system"

  const layout = useLayoutConfig()

  const themes: { value: ThemeValue; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "浅色", icon: Sun },
    { value: "dark", label: "深色", icon: Moon },
    { value: "system", label: "跟随系统", icon: Monitor },
  ]

  const variants: { value: SidebarVariant; label: string }[] = [
    { value: "sidebar", label: "默认" },
    { value: "floating", label: "浮动" },
    { value: "inset", label: "内嵌" },
  ]

  const collapsibles: { value: SidebarCollapsible; label: string }[] = [
    { value: "icon", label: "图标栏" },
    { value: "offcanvas", label: "抽屉" },
  ]
</script>

<Sheet>
  <SheetTrigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="ghost"
        size="icon-sm"
        aria-label="外观设置"
        title="外观设置"
      >
        <Settings2 />
      </Button>
    {/snippet}
  </SheetTrigger>
  <SheetContent class="w-80">
    <SheetHeader>
      <SheetTitle>外观</SheetTitle>
      <SheetDescription>
        调整主题、侧栏样式与折叠方式，设置会保存在本机。
      </SheetDescription>
    </SheetHeader>
    <div class="flex flex-col gap-6 px-4 pb-6">
      <section class="flex flex-col gap-2">
        <h3 class="text-sm font-medium">主题</h3>
        <div class="grid grid-cols-3 gap-2" role="group" aria-label="主题">
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
        <h3 class="text-sm font-medium">侧栏样式</h3>
        <div class="grid grid-cols-3 gap-2" role="group" aria-label="侧栏样式">
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
        <h3 class="text-sm font-medium">折叠方式</h3>
        <div class="grid grid-cols-3 gap-2" role="group" aria-label="折叠方式">
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

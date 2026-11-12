<script setup lang="ts">
import { Monitor, Moon, Settings2, Sun } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  useLayoutConfig,
  type SidebarCollapsible,
  type SidebarVariant,
} from "@/composables/use-layout-config"
import { useThemeStore } from "@/stores/theme"

type ThemeValue = "light" | "dark" | "system"

const themeStore = useThemeStore()
const { variant, collapsible, setVariant, setCollapsible } = useLayoutConfig()

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

<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="外观设置"
        title="外观设置"
      >
        <Settings2 />
      </Button>
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
            <Button
              v-for="item in themes"
              :key="item.value"
              type="button"
              :variant="themeStore.theme === item.value ? 'default' : 'outline'"
              :aria-pressed="themeStore.theme === item.value"
              class="h-auto flex-col gap-1.5 px-2 py-3 text-xs"
              @click="themeStore.setTheme(item.value)"
            >
              <component :is="item.icon" class="size-4" />
              {{ item.label }}
            </Button>
          </div>
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="text-sm font-medium">侧栏样式</h3>
          <div
            class="grid grid-cols-3 gap-2"
            role="group"
            aria-label="侧栏样式"
          >
            <Button
              v-for="item in variants"
              :key="item.value"
              type="button"
              :variant="variant === item.value ? 'default' : 'outline'"
              :aria-pressed="variant === item.value"
              class="h-auto flex-col gap-1.5 px-2 py-3 text-xs"
              @click="setVariant(item.value)"
            >
              {{ item.label }}
            </Button>
          </div>
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="text-sm font-medium">折叠方式</h3>
          <div
            class="grid grid-cols-3 gap-2"
            role="group"
            aria-label="折叠方式"
          >
            <Button
              v-for="item in collapsibles"
              :key="item.value"
              type="button"
              :variant="collapsible === item.value ? 'default' : 'outline'"
              :aria-pressed="collapsible === item.value"
              class="h-auto flex-col gap-1.5 px-2 py-3 text-xs"
              @click="setCollapsible(item.value)"
            >
              {{ item.label }}
            </Button>
          </div>
        </section>
      </div>
    </SheetContent>
  </Sheet>
</template>

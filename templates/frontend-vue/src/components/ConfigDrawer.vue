<script setup lang="ts">
import { Monitor, Moon, Settings2, Sun } from "@lucide/vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type {
  SidebarCollapsible,
  SidebarVariant,
} from "@/composables/use-layout-config"
import { useLayoutConfig } from "@/composables/use-layout-config"
import { useThemeStore } from "@/stores/theme"

const THEMES = [
  { value: "light", labelKey: "appearance.light", icon: Sun },
  { value: "dark", labelKey: "appearance.dark", icon: Moon },
  { value: "system", labelKey: "appearance.system", icon: Monitor },
] as const

const VARIANTS: { value: SidebarVariant; labelKey: string }[] = [
  { value: "sidebar", labelKey: "appearance.default" },
  { value: "floating", labelKey: "appearance.floating" },
  { value: "inset", labelKey: "appearance.inset" },
]

const COLLAPSIBLES: { value: SidebarCollapsible; labelKey: string }[] = [
  { value: "icon", labelKey: "appearance.icon" },
  { value: "offcanvas", labelKey: "appearance.offcanvas" },
]

const { t } = useI18n()
const themeStore = useThemeStore()
const { variant, collapsible, setVariant, setCollapsible } = useLayoutConfig()
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button
        variant="ghost"
        size="icon-sm"
        :aria-label="t('common.appearance')"
        :title="t('common.appearance')"
      >
        <Settings2 />
      </Button>
    </SheetTrigger>
    <SheetContent class="w-80">
      <SheetHeader>
        <SheetTitle>{{ t("appearance.title") }}</SheetTitle>
        <SheetDescription>{{ t("appearance.description") }}</SheetDescription>
      </SheetHeader>
      <div class="flex flex-col gap-6 px-4 pb-6">
        <section class="flex flex-col gap-2">
          <h3 class="text-sm font-medium">{{ t("appearance.theme") }}</h3>
          <div
            class="grid grid-cols-3 gap-2"
            role="group"
            :aria-label="t('appearance.theme')"
          >
            <Button
              v-for="option in THEMES"
              :key="option.value"
              type="button"
              :variant="
                themeStore.theme === option.value ? 'default' : 'outline'
              "
              :aria-pressed="themeStore.theme === option.value"
              :class="cn('h-auto flex-col gap-1.5 px-2 py-3 text-xs')"
              @click="themeStore.setTheme(option.value)"
            >
              <component :is="option.icon" class="size-4" />
              {{ t(option.labelKey) }}
            </Button>
          </div>
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="text-sm font-medium">{{ t("appearance.sidebar") }}</h3>
          <div
            class="grid grid-cols-3 gap-2"
            role="group"
            :aria-label="t('appearance.sidebar')"
          >
            <Button
              v-for="option in VARIANTS"
              :key="option.value"
              type="button"
              :variant="variant === option.value ? 'default' : 'outline'"
              :aria-pressed="variant === option.value"
              :class="cn('h-auto flex-col gap-1.5 px-2 py-3 text-xs')"
              @click="setVariant(option.value)"
            >
              {{ t(option.labelKey) }}
            </Button>
          </div>
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="text-sm font-medium">{{ t("appearance.collapse") }}</h3>
          <div
            class="grid grid-cols-3 gap-2"
            role="group"
            :aria-label="t('appearance.collapse')"
          >
            <Button
              v-for="option in COLLAPSIBLES"
              :key="option.value"
              type="button"
              :variant="collapsible === option.value ? 'default' : 'outline'"
              :aria-pressed="collapsible === option.value"
              :class="cn('h-auto flex-col gap-1.5 px-2 py-3 text-xs')"
              @click="setCollapsible(option.value)"
            >
              {{ t(option.labelKey) }}
            </Button>
          </div>
        </section>
      </div>
    </SheetContent>
  </Sheet>
</template>

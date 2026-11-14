<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Moon, Sun } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useThemeStore } from "@/stores/theme"

const { t } = useI18n()
const themeStore = useThemeStore()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon">
        <Sun
          class="scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90"
        />
        <Moon
          class="absolute scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0"
        />
        <span class="sr-only">{{ t("common.theme") }}</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuGroup>
        <DropdownMenuItem @click="themeStore.setTheme('light')">
          {{ t("appearance.light") }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="themeStore.setTheme('dark')">
          {{ t("appearance.dark") }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="themeStore.setTheme('system')">
          {{ t("appearance.system") }}
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
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
        <span class="sr-only">切换主题</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuGroup>
        <DropdownMenuItem @select="themeStore.setTheme('light')">
          浅色
        </DropdownMenuItem>
        <DropdownMenuItem @select="themeStore.setTheme('dark')">
          深色
        </DropdownMenuItem>
        <DropdownMenuItem @select="themeStore.setTheme('system')">
          跟随系统
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

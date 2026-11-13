<script lang="ts">
  import { Moon, Sun } from "@lucide/svelte"
  import { Button } from "#lib/components/ui/button/index.js"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "#lib/components/ui/dropdown-menu/index.js"
  import { setTheme } from "#lib/stores/theme.svelte.js"
</script>

<DropdownMenu>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" size="icon">
        <Sun
          class="scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90"
        />
        <Moon
          class="absolute scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0"
        />
        <span class="sr-only">切换主题</span>
      </Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuGroup>
      <DropdownMenuItem onSelect={() => setTheme("light")}
        >浅色</DropdownMenuItem
      >
      <DropdownMenuItem onSelect={() => setTheme("dark")}>深色</DropdownMenuItem
      >
      <DropdownMenuItem onSelect={() => setTheme("system")}
        >跟随系统</DropdownMenuItem
      >
    </DropdownMenuGroup>
  </DropdownMenuContent>
</DropdownMenu>

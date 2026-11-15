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
  import { t } from "#lib/i18n.js"
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
        <span class="sr-only">{$t("common.theme")}</span>
      </Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuGroup>
      <DropdownMenuItem onSelect={() => setTheme("light")}
        >{$t("appearance.light")}</DropdownMenuItem
      >
      <DropdownMenuItem onSelect={() => setTheme("dark")}
        >{$t("appearance.dark")}</DropdownMenuItem
      >
      <DropdownMenuItem onSelect={() => setTheme("system")}
        >{$t("appearance.system")}</DropdownMenuItem
      >
    </DropdownMenuGroup>
  </DropdownMenuContent>
</DropdownMenu>

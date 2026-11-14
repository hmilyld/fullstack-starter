<script lang="ts">
  import { Check, Languages } from "@lucide/svelte"
  import { Button } from "#lib/components/ui/button/index.js"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "#lib/components/ui/dropdown-menu/index.js"
  import { changeLocale, locale, t, type Locale } from "#lib/i18n.js"

  const OPTIONS: { value: Locale; label: string }[] = [
    { value: "zh-CN", label: "简体中文" },
    { value: "en", label: "English" },
  ]

  const active = $derived($locale)
</script>

<DropdownMenu>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="ghost"
        size="icon-sm"
        aria-label={$t("common.language")}
        title={$t("common.language")}
      >
        <Languages />
      </Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" class="w-40">
    <DropdownMenuLabel>{$t("common.language")}</DropdownMenuLabel>
    <DropdownMenuSeparator />
    {#each OPTIONS as option (option.value)}
      <DropdownMenuItem onSelect={() => void changeLocale(option.value)}>
        <span class="flex-1">{option.label}</span>
        {#if active === option.value}<Check class="size-4" />{/if}
      </DropdownMenuItem>
    {/each}
  </DropdownMenuContent>
</DropdownMenu>

<script lang="ts">
  import { MoreHorizontal } from "@lucide/svelte"
  import type { RowAction } from "#lib/components/shared/row-action.js"
  import { Button } from "#lib/components/ui/button/index.js"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "#lib/components/ui/dropdown-menu/index.js"
  import { t } from "#lib/i18n.js"

  let { actions, label }: { actions: RowAction[]; label?: string } = $props()
</script>

{#if actions.length > 0}
  <DropdownMenu>
    <DropdownMenuTrigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          size="icon-sm"
          aria-label={label ?? $t("common.moreActions")}
        >
          <MoreHorizontal />
        </Button>
      {/snippet}
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-44">
      <DropdownMenuLabel>{$t("common.actions")}</DropdownMenuLabel>
      <DropdownMenuGroup>
        {#each actions as action, index (action.label)}
          {#if action.separatorBefore && index > 0}
            <DropdownMenuSeparator />
          {/if}
          <DropdownMenuItem
            variant={action.destructive ? "destructive" : "default"}
            disabled={action.disabled}
            onSelect={action.onSelect}
          >
            {#if action.icon}
              {@const Icon = action.icon}
              <Icon />
            {/if}
            {action.label}
          </DropdownMenuItem>
        {/each}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
{/if}

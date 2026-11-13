<script lang="ts">
  import { goto } from "$app/navigation"
  import { resolve } from "$app/paths"
  import {
    ChevronsUpDown,
    KeyRound,
    LogOut,
    ShieldCheck,
    UserCog,
  } from "@lucide/svelte"
  import { logout as apiLogout } from "#lib/api/auth.js"
  import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "#lib/components/ui/avatar/index.js"
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
  import { Spinner } from "#lib/components/ui/spinner/index.js"
  import { auth } from "#lib/stores/auth.svelte.js"
  import { siteConfig } from "#lib/stores/site-config.svelte.js"

  let loggingOut = $state(false)

  const user = $derived(auth.user)
  const initial = $derived(user?.name?.charAt(0).toUpperCase() || "?")

  async function handleLogout() {
    loggingOut = true
    try {
      await apiLogout()
    } finally {
      auth.logout()
      await siteConfig.refresh()
      loggingOut = false
      await goto(resolve("login"))
    }
  }
</script>

{#if user}
  <DropdownMenu>
    <DropdownMenuTrigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          class="gap-2 rounded-full pr-2 pl-1"
          aria-label={`${user.name} 的账户菜单`}
        >
          <Avatar class="size-7">
            {#if user.avatar}
              <AvatarImage
                src={user.avatar}
                alt={user.name}
                width={28}
                height={28}
              />
            {/if}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <span class="hidden max-w-24 truncate text-sm font-medium md:inline">
            {user.name}
          </span>
          <ChevronsUpDown
            class="hidden size-4 text-muted-foreground md:block"
          />
        </Button>
      {/snippet}
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-56">
      <DropdownMenuLabel class="p-0 font-normal">
        <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <Avatar class="size-8">
            {#if user.avatar}
              <AvatarImage
                src={user.avatar}
                alt={user.name}
                width={32}
                height={32}
              />
            {/if}
            <AvatarFallback>{user.name?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-medium">{user.name}</span>
            <span class="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem
          onSelect={() => goto(resolve("settings/profile?tab=profile"))}
        >
          <UserCog />
          个人设置
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => goto(resolve("settings/profile?tab=security"))}
        >
          <KeyRound />
          密码修改
        </DropdownMenuItem>
        {#if auth.hasPermission("permissions")}
          <DropdownMenuItem
            onSelect={() => goto(resolve("settings/permission"))}
          >
            <ShieldCheck />
            权限总览
          </DropdownMenuItem>
        {/if}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled={loggingOut} onSelect={handleLogout}>
        {#if loggingOut}<Spinner />{:else}<LogOut />{/if}
        {loggingOut ? "退出中…" : "退出登录"}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
{/if}

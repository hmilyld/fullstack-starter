<script setup lang="ts">
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import {
  ChevronsUpDown,
  KeyRound,
  LogOut,
  ShieldCheck,
  UserCog,
} from "@lucide/vue"
import { logout as apiLogout } from "@/api/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { useAuthStore } from "@/stores/auth"
import { useSiteConfigStore } from "@/stores/site-config"

/** 顶栏右上角的账户菜单：个人设置、密码修改、权限总览、退出登录 */
const auth = useAuthStore()
const siteConfig = useSiteConfigStore()
const router = useRouter()
const loggingOut = ref(false)

const user = computed(() => auth.user)
const initial = computed(() => user.value?.name?.charAt(0).toUpperCase() || "?")

async function handleLogout() {
  loggingOut.value = true
  try {
    await apiLogout()
  } finally {
    auth.logout()
    await siteConfig.refresh()
    loggingOut.value = false
    await router.push("/login")
  }
}
</script>

<template>
  <DropdownMenu v-if="user">
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        class="gap-2 rounded-full pr-2 pl-1"
        :aria-label="`${user.name} 的账户菜单`"
      >
        <Avatar class="size-7">
          <AvatarImage
            v-if="user.avatar"
            :src="user.avatar"
            :alt="user.name"
            :width="28"
            :height="28"
          />
          <AvatarFallback>{{ initial }}</AvatarFallback>
        </Avatar>
        <span class="hidden max-w-24 truncate text-sm font-medium md:inline">
          {{ user.name }}
        </span>
        <ChevronsUpDown class="hidden size-4 text-muted-foreground md:block" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-56">
      <DropdownMenuLabel class="p-0 font-normal">
        <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <Avatar class="size-8">
            <AvatarImage
              v-if="user.avatar"
              :src="user.avatar"
              :alt="user.name"
              :width="32"
              :height="32"
            />
            <AvatarFallback>{{ user.name?.charAt(0) || "?" }}</AvatarFallback>
          </Avatar>
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-medium">{{ user.name }}</span>
            <span class="truncate text-xs text-muted-foreground">
              {{ user.email }}
            </span>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem
          @select="router.push('/settings/profile?tab=profile')"
        >
          <UserCog />
          个人设置
        </DropdownMenuItem>
        <DropdownMenuItem
          @select="router.push('/settings/profile?tab=security')"
        >
          <KeyRound />
          密码修改
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="auth.hasPermission('permissions')"
          @select="router.push('/settings/permission')"
        >
          <ShieldCheck />
          权限总览
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem :disabled="loggingOut" @select="handleLogout">
        <Spinner v-if="loggingOut" />
        <LogOut v-else />
        {{ loggingOut ? "退出中…" : "退出登录" }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

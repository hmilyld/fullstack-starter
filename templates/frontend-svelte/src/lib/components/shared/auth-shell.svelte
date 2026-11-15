<script lang="ts">
  import {
    Database,
    MonitorSmartphone,
    ScrollText,
    ShieldCheck,
  } from "@lucide/svelte"
  import BrandMark from "#lib/components/brand-mark.svelte"
  import LanguageSwitcher from "#lib/components/app-shell/language-switcher.svelte"
  import { t } from "#lib/i18n.js"
  import { siteConfig } from "#lib/stores/site-config.svelte.js"
  import type { Snippet } from "svelte"

  let { children }: { children?: Snippet } = $props()

  const siteName = $derived(
    siteConfig.config?.siteName || $t("authShell.fallbackName")
  )
  const siteDescription = $derived(
    siteConfig.config?.siteDescription || $t("authShell.fallbackDescription")
  )

  const capabilities = $derived([
    {
      icon: ShieldCheck,
      label: $t("authShell.capabilities.rbac.label"),
      description: $t("authShell.capabilities.rbac.description"),
    },
    {
      icon: ScrollText,
      label: $t("authShell.capabilities.audit.label"),
      description: $t("authShell.capabilities.audit.description"),
    },
    {
      icon: Database,
      label: $t("authShell.capabilities.data.label"),
      description: $t("authShell.capabilities.data.description"),
    },
    {
      icon: MonitorSmartphone,
      label: $t("authShell.capabilities.responsive.label"),
      description: $t("authShell.capabilities.responsive.description"),
    },
  ])
</script>

<main
  class="flex min-h-svh items-center justify-center bg-background px-(--layout-gutter) py-6 pb-[max(2rem,env(safe-area-inset-bottom))] md:py-10"
>
  <div
    class="grid w-full max-w-6xl overflow-hidden rounded-2xl border bg-card shadow-xl max-lg:rounded-none max-lg:border-0 max-lg:bg-transparent max-lg:shadow-none max-lg:ring-0 lg:grid-cols-[1.08fr_1fr]"
  >
    <aside
      class="relative hidden flex-col justify-between gap-10 overflow-hidden bg-primary p-10 text-primary-foreground lg:flex xl:p-14 dark:border-border dark:bg-background dark:text-foreground dark:lg:border-r"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent"
      ></div>
      <div class="relative flex items-center gap-3">
        <div
          class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card shadow-sm ring-1 ring-primary-foreground/10 dark:ring-border"
        >
          <BrandMark class="size-8" />
        </div>
        <div class="flex min-w-0 flex-col">
          <p class="truncate text-base font-semibold">{siteName}</p>
          <p
            class="line-clamp-2 text-sm text-primary-foreground/60 dark:text-muted-foreground"
          >
            {siteDescription}
          </p>
        </div>
      </div>

      <div class="relative flex flex-col gap-4">
        <p
          class="text-3xl leading-[1.15] font-semibold tracking-tight text-balance xl:text-4xl"
        >
          {$t("authShell.headlineLine1")}<br />
          {$t("authShell.headlineLine2")}
        </p>
        <p
          class="max-w-md text-sm leading-relaxed text-primary-foreground/60 dark:text-muted-foreground"
        >
          {$t("authShell.subtitle")}
        </p>
      </div>

      <div
        class="relative grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-primary-foreground/10 bg-primary-foreground/10 dark:border-border dark:bg-border"
      >
        {#each capabilities as item (item.label)}
          {@const Icon = item.icon}
          <div
            class="flex items-start gap-2.5 bg-primary p-3.5 dark:bg-background"
          >
            <Icon class="mt-0.5 size-4 shrink-0 opacity-70" />
            <div class="min-w-0">
              <p class="text-sm font-medium">{item.label}</p>
              <p class="mt-0.5 text-xs leading-relaxed opacity-60">
                {item.description}
              </p>
            </div>
          </div>
        {/each}
      </div>
    </aside>

    <section class="flex flex-col justify-center p-5 py-8 sm:p-8 lg:p-12">
      <div class="mx-auto flex w-full max-w-sm flex-col gap-6">
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3 lg:hidden">
            <BrandMark class="size-9" />
            <div class="flex min-w-0 flex-col">
              <p class="truncate text-sm font-semibold">{siteName}</p>
              <p class="line-clamp-1 text-xs text-muted-foreground">
                {siteDescription}
              </p>
            </div>
          </div>
          <div class="ml-auto">
            <LanguageSwitcher />
          </div>
        </div>
        {@render children?.()}
      </div>
    </section>
  </div>
</main>

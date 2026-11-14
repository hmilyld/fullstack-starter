<script lang="ts">
  import { beforeNavigate, goto } from "$app/navigation"
  import { page } from "$app/state"
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "#lib/components/ui/alert-dialog/index.js"
  import { t } from "#lib/i18n.js"

  let { when }: { when: boolean } = $props()

  let open = $state(false)
  let pending: URL | null = null
  let allowNext = false

  beforeNavigate((navigation) => {
    if (allowNext) {
      allowNext = false
      return
    }
    // 同一页面的 tab / 查询参数变化不算离开
    if (!when || navigation.to?.route.id === page.route.id) return
    navigation.cancel()
    pending = navigation.to?.url ?? null
    open = true
  })

  function proceed() {
    open = false
    const target = pending
    pending = null
    if (!target) return
    allowNext = true
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- 目标是导航拦截到的 URL 对象
    void goto(target)
  }

  function stay() {
    open = false
    pending = null
  }

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (!when) return
    event.preventDefault()
    event.returnValue = ""
  }
</script>

<svelte:window onbeforeunload={handleBeforeUnload} />

<AlertDialog bind:open>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{$t("common.unsaved.title")}</AlertDialogTitle>
      <AlertDialogDescription>
        {$t("common.unsaved.description")}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onclick={stay}
        >{$t("common.unsaved.stay")}</AlertDialogCancel
      >
      <AlertDialogAction onclick={proceed}
        >{$t("common.unsaved.discard")}</AlertDialogAction
      >
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

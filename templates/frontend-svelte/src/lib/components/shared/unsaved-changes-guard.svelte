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
      <AlertDialogTitle>放弃未保存的修改？</AlertDialogTitle>
      <AlertDialogDescription>
        当前页面还有未保存的内容，离开后这些修改会丢失。
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onclick={stay}>留在本页</AlertDialogCancel>
      <AlertDialogAction onclick={proceed}>放弃修改</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

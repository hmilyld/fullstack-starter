<script lang="ts">
  import { tick, untrack } from "svelte"
  import { Calendar, ChevronLeft, ChevronRight, X } from "@lucide/svelte"
  import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "#lib/components/ui/popover/index.js"
  import {
    buildMonthCells,
    formatDateTimeInput,
    formatMonthLabel,
    nowParts,
    parseDateTimeInput,
    toDateTimeInput,
    todayKey,
    type DateTimeParts,
  } from "#lib/date-time.js"
  import { cn } from "#lib/utils.js"

  const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"]

  const ARROW_STEPS: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    ArrowDown: 7,
  }

  let {
    value = $bindable(""),
    id,
    name,
    placeholder = "选择日期时间",
    disabled = false,
    class: className,
  }: {
    value?: string
    id?: string
    name?: string
    placeholder?: string
    disabled?: boolean
    class?: string
  } = $props()

  const pad = (value: number) => String(value).padStart(2, "0")
  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value))

  let open = $state(false)
  const parts = $derived(parseDateTimeInput(value))
  let view = $state({ year: 0, month: 1 })
  let hourText = $state("00")
  let minuteText = $state("00")
  let grid = $state<HTMLDivElement | null>(null)
  let pendingFocus = $state<string | null>(null)

  function syncView() {
    const base = parts ?? nowParts()
    view = { year: base.year, month: base.month }
  }

  function syncText() {
    const current = parts
    if (!current) return
    if (Number(hourText) !== current.hour) hourText = pad(current.hour)
    if (Number(minuteText) !== current.minute) minuteText = pad(current.minute)
  }

  syncView()
  syncText()

  $effect(() => {
    const current = parts
    if (!current) return
    const hour = current.hour
    const minute = current.minute
    // 只跟随外部值变化；读取本地输入时不要反向触发，避免清空后立刻被旧值覆盖
    untrack(() => {
      if (Number(hourText) !== hour) hourText = pad(hour)
      if (Number(minuteText) !== minute) minuteText = pad(minute)
    })
  })

  $effect(() => {
    if (!open) return
    syncView()
  })

  const dateKey = $derived.by(() => {
    const current = parts
    return current
      ? `${current.year}-${pad(current.month)}-${pad(current.day)}`
      : ""
  })
  const cells = $derived(buildMonthCells(view.year, view.month))
  const today = todayKey()

  const focusableDate = $derived.by(() => {
    const list = cells
    if (list.some((cell) => cell.date === dateKey)) return dateKey
    if (list.some((cell) => cell.date === today)) return today
    return list.find((cell) => cell.inMonth)?.date ?? list[0].date
  })

  $effect(() => {
    const key = pendingFocus
    void cells
    if (!key) return
    void tick().then(() => {
      const button = grid?.querySelector<HTMLButtonElement>(
        `[data-date="${key}"]`
      )
      if (!button) return
      button.focus()
      pendingFocus = null
    })
  })

  function shiftMonth(step: number) {
    const index = view.year * 12 + (view.month - 1) + step
    view = { year: Math.floor(index / 12), month: (index % 12) + 1 }
  }

  function emitParts(next: DateTimeParts) {
    value = toDateTimeInput(next)
  }

  function emitTime(hour: number, minute: number) {
    const base = parts ?? { ...nowParts(), hour: 0, minute: 0 }
    emitParts({ ...base, hour, minute })
  }

  function selectDay(date: string) {
    const [year, month, day] = date.split("-").map(Number)
    emitParts({
      year,
      month,
      day,
      hour: parts?.hour ?? 0,
      minute: parts?.minute ?? 0,
    })
    if (!parts) {
      hourText = "00"
      minuteText = "00"
    }
    view = { year, month }
  }

  function commitTime(kind: "hour" | "minute", raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 2)
    if (kind === "hour") hourText = digits
    else minuteText = digits
    if (digits === "") return

    const max = kind === "hour" ? 23 : 59
    const next = clamp(Number(digits), 0, max)
    if (kind === "hour") emitTime(next, parts?.minute ?? 0)
    else emitTime(parts?.hour ?? 0, next)
  }

  function blurTime(kind: "hour" | "minute") {
    const raw = kind === "hour" ? hourText : minuteText
    const max = kind === "hour" ? 23 : 59
    const next = clamp(Number(raw || 0), 0, max)
    if (kind === "hour") hourText = pad(next)
    else minuteText = pad(next)

    if (!parts && raw === "") return
    const committed = parts
      ? kind === "hour"
        ? parts.hour
        : parts.minute
      : null
    if (next === committed) return

    if (kind === "hour") emitTime(next, parts?.minute ?? 0)
    else emitTime(parts?.hour ?? 0, next)
  }

  function handleGridKeyDown(event: KeyboardEvent) {
    const step = ARROW_STEPS[event.key]
    if (!step) return
    const current = (event.target as HTMLElement).dataset.date
    if (!current) return
    event.preventDefault()

    const [year, month, day] = current.split("-").map(Number)
    const next = new Date(year, month - 1, day + step)
    const key = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`
    const button = grid?.querySelector<HTMLButtonElement>(
      `[data-date="${key}"]`
    )
    if (button) {
      button.focus()
      return
    }
    pendingFocus = key
    view = { year: next.getFullYear(), month: next.getMonth() + 1 }
  }

  function setNow() {
    const now = nowParts()
    emitParts(now)
    view = { year: now.year, month: now.month }
    hourText = pad(now.hour)
    minuteText = pad(now.minute)
  }

  function clear() {
    value = ""
    hourText = "00"
    minuteText = "00"
  }
</script>

{#if name}<input type="hidden" {name} {value} />{/if}
<Popover bind:open>
  <PopoverTrigger>
    {#snippet child({ props })}
      <button
        {...props}
        {id}
        type="button"
        {disabled}
        class={cn(
          "flex h-(--control-h) w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-2.5 py-1 text-left text-base shadow-xs transition-[color,box-shadow] duration-200 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
          !value && "text-muted-foreground",
          className
        )}
      >
        <span class="truncate tabular-nums">
          {value ? formatDateTimeInput(value) : placeholder}
        </span>
        <Calendar
          class="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </button>
    {/snippet}
  </PopoverTrigger>

  <PopoverContent class="w-[17.5rem] p-3 [@media(pointer:coarse)]:w-[22rem]">
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <button
          type="button"
          aria-label="上个月"
          class="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:size-9"
          onclick={() => shiftMonth(-1)}
        >
          <ChevronLeft class="size-4" />
        </button>
        <span class="text-sm font-medium tabular-nums">
          {formatMonthLabel(view.year, view.month)}
        </span>
        <button
          type="button"
          aria-label="下个月"
          class="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:size-9"
          onclick={() => shiftMonth(1)}
        >
          <ChevronRight class="size-4" />
        </button>
      </div>

      <div class="grid grid-cols-7">
        {#each WEEKDAYS as label (label)}
          <span
            class="flex h-7 items-center justify-center text-xs text-muted-foreground"
          >
            {label}
          </span>
        {/each}
      </div>

      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div
        bind:this={grid}
        role="group"
        aria-label="选择日期"
        class="grid grid-cols-7 gap-y-0.5 [@media(pointer:coarse)]:gap-y-1"
        onkeydown={handleGridKeyDown}
      >
        {#each cells as cell (cell.date)}
          <button
            type="button"
            data-date={cell.date}
            tabindex={cell.date === focusableDate ? 0 : -1}
            aria-pressed={cell.date === dateKey}
            aria-label={cell.date}
            class={cn(
              "mx-auto flex size-8 items-center justify-center rounded-md text-sm tabular-nums transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:size-11",
              !cell.inMonth && "text-muted-foreground",
              cell.date === dateKey &&
                "bg-primary text-primary-foreground hover:bg-primary",
              cell.date !== dateKey &&
                cell.date === today &&
                "font-medium text-primary ring-1 ring-primary/40 ring-inset"
            )}
            onclick={() => selectDay(cell.date)}
          >
            {cell.day}
          </button>
        {/each}
      </div>

      <div class="flex items-center gap-2 border-t pt-2.5">
        <span class="text-xs text-muted-foreground">时间</span>
        <input
          aria-label="小时"
          inputmode="numeric"
          autocomplete="off"
          value={hourText}
          class="h-7 w-10 rounded-md border border-input bg-transparent text-center text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:h-10 [@media(pointer:coarse)]:w-12"
          oninput={(event) =>
            commitTime("hour", (event.target as HTMLInputElement).value)}
          onblur={() => blurTime("hour")}
        />
        <span class="text-sm text-muted-foreground">:</span>
        <input
          aria-label="分钟"
          inputmode="numeric"
          autocomplete="off"
          value={minuteText}
          class="h-7 w-10 rounded-md border border-input bg-transparent text-center text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:h-10 [@media(pointer:coarse)]:w-12"
          oninput={(event) =>
            commitTime("minute", (event.target as HTMLInputElement).value)}
          onblur={() => blurTime("minute")}
        />
        <button
          type="button"
          class="ml-auto rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:px-3"
          onclick={setNow}
        >
          此刻
        </button>
      </div>

      <div class="flex items-center justify-between border-t pt-2">
        <button
          type="button"
          disabled={!value}
          class="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:px-3"
          onclick={clear}
        >
          <X class="size-3.5" />
          清除
        </button>
        <button
          type="button"
          class="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:px-4"
          onclick={() => (open = false)}
        >
          完成
        </button>
      </div>
    </div>
  </PopoverContent>
</Popover>

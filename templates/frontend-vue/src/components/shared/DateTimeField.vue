<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { computed, nextTick, ref, watch } from "vue"
import { Calendar, ChevronLeft, ChevronRight, X } from "@lucide/vue"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  buildMonthCells,
  formatDateTimeInput,
  formatMonthLabel,
  nowParts,
  parseDateTimeInput,
  toDateTimeInput,
  todayKey,
  type DateTimeParts,
} from "@/lib/date-time"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"]

/** 方向键在日历里移动的天数 */
const ARROW_STEPS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    id?: string
    /** 保留表单字段名的语义，值以隐藏域提交 */
    name?: string
    placeholder?: string
    disabled?: boolean
    class?: HTMLAttributes["class"]
  }>(),
  { placeholder: "选择日期时间" }
)

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
}>()

const pad = (value: number) => String(value).padStart(2, "0")
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const open = ref(false)
const parts = computed(() => parseDateTimeInput(props.modelValue))
const view = ref({ year: 0, month: 1 })
const hourText = ref("00")
const minuteText = ref("00")
const gridRef = ref<HTMLDivElement | null>(null)
// 方向键移动到上/下月时，等新月份渲染完再落焦点
const pendingFocus = ref<string | null>(null)

function syncView() {
  const base = parts.value ?? nowParts()
  view.value = { year: base.year, month: base.month }
}

function syncText() {
  const current = parts.value
  if (!current) return
  if (Number(hourText.value) !== current.hour) {
    hourText.value = pad(current.hour)
  }
  if (Number(minuteText.value) !== current.minute) {
    minuteText.value = pad(current.minute)
  }
}

syncView()
syncText()
// 外部值变化（回填 URL、重置）时同步时分输入；本地输入不回写，避免光标跳动
watch(() => props.modelValue, syncText)

const dateKey = computed(() => {
  const current = parts.value
  return current
    ? `${current.year}-${pad(current.month)}-${pad(current.day)}`
    : ""
})
const cells = computed(() => buildMonthCells(view.value.year, view.value.month))
const today = todayKey()

// 日历只保留一个 Tab 落点，进入后用方向键移动
const focusableDate = computed(() => {
  const list = cells.value
  if (list.some((cell) => cell.date === dateKey.value)) return dateKey.value
  if (list.some((cell) => cell.date === today)) return today
  return list.find((cell) => cell.inMonth)?.date ?? list[0].date
})

watch(cells, async () => {
  const key = pendingFocus.value
  if (!key) return
  await nextTick()
  const button = gridRef.value?.querySelector<HTMLButtonElement>(
    `[data-date="${key}"]`
  )
  if (!button) return
  button.focus()
  pendingFocus.value = null
})

function handleOpenChange(next: boolean) {
  open.value = next
  if (next) syncView()
}

function shiftMonth(step: number) {
  const index = view.value.year * 12 + (view.value.month - 1) + step
  view.value = { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

function emitParts(next: DateTimeParts) {
  emit("update:modelValue", toDateTimeInput(next))
}

function emitTime(hour: number, minute: number) {
  const base = parts.value ?? { ...nowParts(), hour: 0, minute: 0 }
  emitParts({ ...base, hour, minute })
}

function selectDay(date: string) {
  const [year, month, day] = date.split("-").map(Number)
  // 还没选过时间时默认整天起点，避免出现当前时刻这种意外值
  emitParts({
    year,
    month,
    day,
    hour: parts.value?.hour ?? 0,
    minute: parts.value?.minute ?? 0,
  })
  if (!parts.value) {
    hourText.value = "00"
    minuteText.value = "00"
  }
  view.value = { year, month }
}

function commitTime(kind: "hour" | "minute", raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 2)
  if (kind === "hour") hourText.value = digits
  else minuteText.value = digits
  if (digits === "") return

  const max = kind === "hour" ? 23 : 59
  const next = clamp(Number(digits), 0, max)
  if (kind === "hour") emitTime(next, parts.value?.minute ?? 0)
  else emitTime(parts.value?.hour ?? 0, next)
}

// 失焦时补齐两位并提交：否则输入框显示 00、真实值仍是 08:30
function blurTime(kind: "hour" | "minute") {
  const raw = kind === "hour" ? hourText.value : minuteText.value
  const max = kind === "hour" ? 23 : 59
  const next = clamp(Number(raw || 0), 0, max)
  if (kind === "hour") hourText.value = pad(next)
  else minuteText.value = pad(next)

  // 没有任何值、也没输入过：不要凭空生成时间和日期
  if (!parts.value && raw === "") return
  const committed = parts.value
    ? kind === "hour"
      ? parts.value.hour
      : parts.value.minute
    : null
  if (next === committed) return

  if (kind === "hour") emitTime(next, parts.value?.minute ?? 0)
  else emitTime(parts.value?.hour ?? 0, next)
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
  const button = gridRef.value?.querySelector<HTMLButtonElement>(
    `[data-date="${key}"]`
  )
  if (button) {
    button.focus()
    return
  }
  pendingFocus.value = key
  view.value = { year: next.getFullYear(), month: next.getMonth() + 1 }
}

function setNow() {
  const now = nowParts()
  emitParts(now)
  view.value = { year: now.year, month: now.month }
  hourText.value = pad(now.hour)
  minuteText.value = pad(now.minute)
}

function clear() {
  emit("update:modelValue", "")
  hourText.value = "00"
  minuteText.value = "00"
}
</script>

<template>
  <input v-if="name" type="hidden" :name="name" :value="modelValue" />
  <Popover :open="open" @update:open="handleOpenChange">
    <PopoverTrigger as-child>
      <button
        :id="id"
        type="button"
        :disabled="disabled"
        :class="
          cn(
            'flex h-(--control-h) w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-2.5 py-1 text-left text-base shadow-xs transition-[color,box-shadow] duration-200 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
            !modelValue && 'text-muted-foreground',
            props.class
          )
        "
      >
        <span class="truncate tabular-nums">
          {{ modelValue ? formatDateTimeInput(modelValue) : placeholder }}
        </span>
        <Calendar
          class="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </button>
    </PopoverTrigger>

    <PopoverContent class="w-[17.5rem] p-3 [@media(pointer:coarse)]:w-[22rem]">
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <button
            type="button"
            aria-label="上个月"
            class="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:size-9"
            @click="shiftMonth(-1)"
          >
            <ChevronLeft class="size-4" />
          </button>
          <span class="text-sm font-medium tabular-nums">
            {{ formatMonthLabel(view.year, view.month) }}
          </span>
          <button
            type="button"
            aria-label="下个月"
            class="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:size-9"
            @click="shiftMonth(1)"
          >
            <ChevronRight class="size-4" />
          </button>
        </div>

        <div class="grid grid-cols-7">
          <span
            v-for="label in WEEKDAYS"
            :key="label"
            class="flex h-7 items-center justify-center text-xs text-muted-foreground"
          >
            {{ label }}
          </span>
        </div>

        <div
          ref="gridRef"
          role="group"
          aria-label="选择日期"
          class="grid grid-cols-7 gap-y-0.5 [@media(pointer:coarse)]:gap-y-1"
          @keydown="handleGridKeyDown"
        >
          <button
            v-for="cell in cells"
            :key="cell.date"
            type="button"
            :data-date="cell.date"
            :tabindex="cell.date === focusableDate ? 0 : -1"
            :aria-pressed="cell.date === dateKey"
            :aria-label="cell.date"
            :class="
              cn(
                'mx-auto flex size-8 items-center justify-center rounded-md text-sm tabular-nums transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:size-11',
                !cell.inMonth && 'text-muted-foreground',
                cell.date === dateKey &&
                  'bg-primary text-primary-foreground hover:bg-primary',
                cell.date !== dateKey &&
                  cell.date === today &&
                  'font-medium text-primary ring-1 ring-primary/40 ring-inset'
              )
            "
            @click="selectDay(cell.date)"
          >
            {{ cell.day }}
          </button>
        </div>

        <div class="flex items-center gap-2 border-t pt-2.5">
          <span class="text-xs text-muted-foreground">时间</span>
          <input
            aria-label="小时"
            inputmode="numeric"
            autocomplete="off"
            :value="hourText"
            class="h-7 w-10 rounded-md border border-input bg-transparent text-center text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:h-10 [@media(pointer:coarse)]:w-12"
            @input="
              commitTime('hour', ($event.target as HTMLInputElement).value)
            "
            @blur="blurTime('hour')"
          />
          <span class="text-sm text-muted-foreground">:</span>
          <input
            aria-label="分钟"
            inputmode="numeric"
            autocomplete="off"
            :value="minuteText"
            class="h-7 w-10 rounded-md border border-input bg-transparent text-center text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:h-10 [@media(pointer:coarse)]:w-12"
            @input="
              commitTime('minute', ($event.target as HTMLInputElement).value)
            "
            @blur="blurTime('minute')"
          />
          <button
            type="button"
            class="ml-auto rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:px-3"
            @click="setNow"
          >
            此刻
          </button>
        </div>

        <div class="flex items-center justify-between border-t pt-2">
          <button
            type="button"
            :disabled="!modelValue"
            class="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:px-3"
            @click="clear"
          >
            <X class="size-3.5" />
            清除
          </button>
          <button
            type="button"
            class="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:px-4"
            @click="open = false"
          >
            完成
          </button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

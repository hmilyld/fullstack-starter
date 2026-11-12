<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { computed, ref, watch } from "vue"
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

  const base = parts.value ?? { ...nowParts(), hour: 0, minute: 0 }
  const max = kind === "hour" ? 23 : 59
  const next = clamp(Number(digits), 0, max)
  emitParts({
    ...base,
    hour: kind === "hour" ? next : base.hour,
    minute: kind === "minute" ? next : base.minute,
  })
}

function blurTime(kind: "hour" | "minute") {
  const current = kind === "hour" ? hourText.value : minuteText.value
  const max = kind === "hour" ? 23 : 59
  const padded = pad(clamp(Number(current || 0), 0, max))
  if (kind === "hour") hourText.value = padded
  else minuteText.value = padded
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

    <PopoverContent class="w-[17.5rem] p-3">
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <button
            type="button"
            aria-label="上个月"
            class="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
            class="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
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

        <div class="grid grid-cols-7 gap-y-0.5">
          <button
            v-for="cell in cells"
            :key="cell.date"
            type="button"
            :aria-pressed="cell.date === dateKey"
            :aria-label="cell.date"
            :class="
              cn(
                'mx-auto flex size-8 items-center justify-center rounded-md text-sm tabular-nums transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
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
            class="h-7 w-10 rounded-md border border-input bg-transparent text-center text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
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
            class="h-7 w-10 rounded-md border border-input bg-transparent text-center text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
            @input="
              commitTime('minute', ($event.target as HTMLInputElement).value)
            "
            @blur="blurTime('minute')"
          />
          <button
            type="button"
            class="ml-auto rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            @click="setNow"
          >
            此刻
          </button>
        </div>

        <div class="flex items-center justify-between border-t pt-2">
          <button
            type="button"
            :disabled="!modelValue"
            class="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            @click="clear"
          >
            <X class="size-3.5" />
            清除
          </button>
          <button
            type="button"
            class="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
            @click="open = false"
          >
            完成
          </button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

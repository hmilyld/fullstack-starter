<script setup lang="ts">
import { computed } from "vue"

type TrendPoint = {
  label: string
  success: number
  failed: number
  total: number
}

const props = defineProps<{ points: TrendPoint[] }>()

const max = computed(() =>
  Math.max(
    1,
    ...props.points.map((point) => Math.max(point.success, point.failed))
  )
)

const weekFailed = computed(() =>
  props.points.reduce((sum, point) => sum + point.failed, 0)
)

const ticks = computed(() =>
  [1, 0.5, 0].map((ratio) => Math.round(max.value * ratio))
)

/** viewBox 0..100，preserveAspectRatio=none 拉伸，线宽用 non-scaling-stroke 校正 */
function xAt(index: number) {
  return props.points.length > 1
    ? (index / (props.points.length - 1)) * 100
    : 50
}

function yAt(value: number) {
  return 100 - (value / max.value) * 100
}

function lineFor(key: "success" | "failed") {
  return props.points
    .map(
      (point, index) => `${xAt(index).toFixed(2)},${yAt(point[key]).toFixed(2)}`
    )
    .join(" ")
}

const successLine = computed(() => lineFor("success"))
const failedLine = computed(() => lineFor("failed"))

const successArea = computed(
  () => `M0,100 L${successLine.value.split(" ").join(" L")} L100,100 Z`
)

const successDots = computed(() =>
  props.points.map((point, index) => ({
    label: point.label,
    x: xAt(index),
    y: yAt(point.success),
    text: `${point.label}：成功 ${point.success} 次，失败或被拦截 ${point.failed} 次`,
  }))
)
</script>

<template>
  <div class="flex h-full flex-col gap-2">
    <div class="relative flex-1">
      <div class="absolute inset-0 flex flex-col justify-between">
        <div v-for="tick in ticks" :key="tick" class="flex items-center gap-2">
          <span
            class="w-7 shrink-0 text-right text-[10px] text-muted-foreground tabular-nums"
          >
            {{ tick }}
          </span>
          <span class="h-px flex-1 bg-border/70" />
        </div>
      </div>

      <div class="absolute inset-y-0 right-1 left-9">
        <svg
          class="h-full w-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label="近 7 天操作趋势"
        >
          <defs>
            <linearGradient id="trend-fill-vue" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stop-color="var(--chart-1)"
                stop-opacity="0.28"
              />
              <stop
                offset="100%"
                stop-color="var(--chart-1)"
                stop-opacity="0"
              />
            </linearGradient>
          </defs>
          <path :d="successArea" fill="url(#trend-fill-vue)" />
          <polyline
            :points="successLine"
            fill="none"
            stroke="var(--chart-1)"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
            vector-effect="non-scaling-stroke"
          />
          <polyline
            v-if="weekFailed > 0"
            :points="failedLine"
            fill="none"
            stroke="var(--destructive)"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>

        <div class="pointer-events-none absolute inset-0">
          <span
            v-for="dot in successDots"
            :key="dot.label"
            class="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-chart-1"
            :style="{ left: `${dot.x}%`, top: `${dot.y}%` }"
            :title="dot.text"
          />
        </div>
      </div>
    </div>

    <div class="ml-9 flex pr-1">
      <span
        v-for="point in points"
        :key="point.label"
        class="flex-1 text-center text-[10px] text-muted-foreground tabular-nums"
      >
        {{ point.label }}
      </span>
    </div>

    <table class="sr-only">
      <caption>
        近 7 天操作趋势
      </caption>
      <thead>
        <tr>
          <th scope="col">日期</th>
          <th scope="col">成功</th>
          <th scope="col">失败或被拦截</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="point in points" :key="point.label">
          <th scope="row">{{ point.label }}</th>
          <td>{{ point.success }}</td>
          <td>{{ point.failed }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

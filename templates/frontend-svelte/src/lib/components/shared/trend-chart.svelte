<script lang="ts">
  type TrendPoint = {
    label: string
    success: number
    failed: number
    total: number
  }

  let { points }: { points: TrendPoint[] } = $props()

  const max = $derived(
    Math.max(1, ...points.map((point) => Math.max(point.success, point.failed)))
  )

  const weekFailed = $derived(
    points.reduce((sum, point) => sum + point.failed, 0)
  )

  // 去重：最大值只有 1 时 1 / 0.5 / 0 会取整成 1 / 1 / 0
  const ticks = $derived(
    Array.from(new Set([1, 0.5, 0].map((ratio) => Math.round(max * ratio))))
  )

  /** viewBox 0..100，preserveAspectRatio=none 拉伸，线宽用 non-scaling-stroke 校正 */
  function xAt(index: number) {
    return points.length > 1 ? (index / (points.length - 1)) * 100 : 50
  }

  function yAt(value: number) {
    return 100 - (value / max) * 100
  }

  function lineFor(key: "success" | "failed") {
    return points
      .map(
        (point, index) =>
          `${xAt(index).toFixed(2)},${yAt(point[key]).toFixed(2)}`
      )
      .join(" ")
  }

  const successLine = $derived(lineFor("success"))
  const failedLine = $derived(lineFor("failed"))
  const successArea = $derived(
    `M0,100 L${successLine.split(" ").join(" L")} L100,100 Z`
  )
  const successDots = $derived(
    points.map((point, index) => ({
      label: point.label,
      x: xAt(index),
      y: yAt(point.success),
      text: `${point.label}：成功 ${point.success} 次，失败或被拦截 ${point.failed} 次`,
    }))
  )
</script>

<div class="flex h-full flex-col gap-2">
  <div class="relative flex-1">
    <div class="absolute inset-0 flex flex-col justify-between">
      {#each ticks as tick, index (`${tick}-${index}`)}
        <div class="flex items-center gap-2">
          <span
            class="w-7 shrink-0 text-right text-[10px] text-muted-foreground tabular-nums"
          >
            {tick}
          </span>
          <span class="h-px flex-1 bg-border/70"></span>
        </div>
      {/each}
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
          <linearGradient id="trend-fill-svelte" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--chart-1)" stop-opacity="0.34" />
            <stop offset="100%" stop-color="var(--chart-1)" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path d={successArea} fill="url(#trend-fill-svelte)"></path>
        <polyline
          points={successLine}
          fill="none"
          stroke="var(--chart-1)"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
          vector-effect="non-scaling-stroke"
        />
        {#if weekFailed > 0}
          <polyline
            points={failedLine}
            fill="none"
            stroke="var(--destructive)"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
            vector-effect="non-scaling-stroke"
          />
        {/if}
      </svg>

      <div class="pointer-events-none absolute inset-0">
        {#each successDots as dot (dot.label)}
          <span
            class="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-chart-1"
            style="left: {dot.x}%; top: {dot.y}%"
            title={dot.text}
          ></span>
        {/each}
      </div>
    </div>
  </div>

  <div class="ml-9 flex pr-1">
    {#each points as point (point.label)}
      <span
        class="flex-1 text-center text-[10px] text-muted-foreground tabular-nums"
      >
        {point.label}
      </span>
    {/each}
  </div>

  <table class="sr-only">
    <caption>近 7 天操作趋势</caption>
    <thead>
      <tr>
        <th scope="col">日期</th>
        <th scope="col">成功</th>
        <th scope="col">失败或被拦截</th>
      </tr>
    </thead>
    <tbody>
      {#each points as point (point.label)}
        <tr>
          <th scope="row">{point.label}</th>
          <td>{point.success}</td>
          <td>{point.failed}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

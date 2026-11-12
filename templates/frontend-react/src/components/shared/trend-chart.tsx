import * as React from "react"

export type TrendPoint = {
  label: string
  success: number
  failed: number
  total: number
}

/**
 * 近 7 天操作趋势：自绘 SVG 面积图，无第三方图表依赖。
 * 与 Vue 端 TrendChart 保持同一套坐标与视觉。
 */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const gradientId = React.useId().replace(/:/g, "")
  const max = Math.max(
    1,
    ...points.map((point) => Math.max(point.success, point.failed))
  )
  const weekFailed = points.reduce((sum, point) => sum + point.failed, 0)
  const ticks = [1, 0.5, 0].map((ratio) => Math.round(max * ratio))

  const xAt = (index: number) =>
    points.length > 1 ? (index / (points.length - 1)) * 100 : 50
  const yAt = (value: number) => 100 - (value / max) * 100

  const lineFor = (key: "success" | "failed") =>
    points
      .map(
        (point, index) =>
          `${xAt(index).toFixed(2)},${yAt(point[key]).toFixed(2)}`
      )
      .join(" ")

  const successLine = lineFor("success")
  const failedLine = lineFor("failed")
  const successArea = `M0,100 L${successLine.split(" ").join(" L")} L100,100 Z`

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="relative flex-1">
        <div className="absolute inset-0 flex flex-col justify-between">
          {ticks.map((tick, index) => (
            <div key={`${tick}-${index}`} className="flex items-center gap-2">
              <span className="w-7 shrink-0 text-right text-[10px] text-muted-foreground tabular-nums">
                {tick}
              </span>
              <span className="h-px flex-1 bg-border/70" />
            </div>
          ))}
        </div>

        <div className="absolute inset-y-0 right-1 left-9">
          <svg
            className="h-full w-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            role="img"
            aria-label="近 7 天操作趋势"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--chart-1)"
                  stopOpacity="0.34"
                />
                <stop
                  offset="100%"
                  stopColor="var(--chart-1)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>
            <path d={successArea} fill={`url(#${gradientId})`} />
            <polyline
              points={successLine}
              fill="none"
              stroke="var(--chart-1)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {weekFailed > 0 && (
              <polyline
                points={failedLine}
                fill="none"
                stroke="var(--destructive)"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          <div className="pointer-events-none absolute inset-0">
            {points.map((point, index) => (
              <span
                key={point.label}
                className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-chart-1"
                style={{
                  left: `${xAt(index)}%`,
                  top: `${yAt(point.success)}%`,
                }}
                title={`${point.label}：成功 ${point.success} 次，失败或被拦截 ${point.failed} 次`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="ml-9 flex pr-1">
        {points.map((point) => (
          <span
            key={point.label}
            className="flex-1 text-center text-[10px] text-muted-foreground tabular-nums"
          >
            {point.label}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>近 7 天操作趋势</caption>
        <thead>
          <tr>
            <th scope="col">日期</th>
            <th scope="col">成功</th>
            <th scope="col">失败或被拦截</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.label}>
              <th scope="row">{point.label}</th>
              <td>{point.success}</td>
              <td>{point.failed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

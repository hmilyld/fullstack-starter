export function UnsupportedViewport() {
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-700 flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center md:hidden">
      <svg
        viewBox="0 0 176 88"
        className="h-16 w-auto"
        role="img"
        aria-label="支持的设备：平板与电脑，不支持手机"
      >
        {/* 手机（不支持） */}
        <rect x="4" y="26" width="26" height="46" rx="7" className="fill-muted-foreground/40" />
        <rect x="8" y="32" width="18" height="30" rx="3" className="fill-muted-foreground/25" />
        <line x1="4" y1="76" x2="30" y2="22" className="stroke-foreground" strokeWidth="2" />
        {/* 平板（支持） */}
        <rect x="52" y="16" width="34" height="56" rx="7" className="fill-primary" />
        <rect x="58" y="22" width="22" height="40" rx="3" className="fill-background opacity-90" />
        {/* 电脑（支持） */}
        <rect x="110" y="12" width="62" height="40" rx="4" className="fill-primary" />
        <rect x="116" y="18" width="50" height="26" rx="2" className="fill-background opacity-90" />
        <line x1="126" y1="52" x2="156" y2="52" className="stroke-primary" strokeWidth="3" />
        <line x1="136" y1="52" x2="140" y2="60" className="stroke-primary" strokeWidth="3" />
        <line x1="152" y1="52" x2="148" y2="60" className="stroke-primary" strokeWidth="3" />
      </svg>

      <div className="space-y-1.5">
        <p className="text-xs font-medium tracking-widest text-muted-foreground">设备提示</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          请在电脑或平板端访问
        </h1>
      </div>

      <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
        后台管理的信息与操作较多，小屏幕放不下。请使用电脑或平板浏览器打开，操作会更清晰顺手。
      </p>

      <p className="text-xs text-muted-foreground/70">检测到手机尺寸屏幕</p>
    </div>
  )
}

export default UnsupportedViewport
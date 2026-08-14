<script setup lang="ts"></script>

<template>
  <div class="bg-base-100 unsupported-fade flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center md:hidden">
    <svg
      viewBox="0 0 176 88"
      class="h-16 w-auto"
      role="img"
      aria-label="支持的设备：平板与电脑，不支持手机"
    >
      <!-- 手机（不支持） -->
      <rect x="4" y="26" width="26" height="46" rx="7" class="fill-base-content/40" />
      <rect x="8" y="32" width="18" height="30" rx="3" class="fill-base-content/25" />
      <line x1="4" y1="76" x2="30" y2="22" class="stroke-base-content" stroke-width="2" />
      <!-- 平板（支持） -->
      <rect x="52" y="16" width="34" height="56" rx="7" class="fill-primary" />
      <rect x="58" y="22" width="22" height="40" rx="3" class="fill-base-100 opacity-90" />
      <!-- 电脑（支持） -->
      <rect x="110" y="12" width="62" height="40" rx="4" class="fill-primary" />
      <rect x="116" y="18" width="50" height="26" rx="2" class="fill-base-100 opacity-90" />
      <line x1="126" y1="52" x2="156" y2="52" class="stroke-primary" stroke-width="3" />
      <line x1="136" y1="52" x2="140" y2="60" class="stroke-primary" stroke-width="3" />
      <line x1="152" y1="52" x2="148" y2="60" class="stroke-primary" stroke-width="3" />
    </svg>

    <div class="space-y-1.5">
      <p class="text-base-content/60 text-xs font-medium tracking-widest">设备提示</p>
      <h1 class="text-2xl font-semibold tracking-tight">请在电脑或平板端访问</h1>
    </div>

    <p class="text-base-content/60 max-w-xs text-sm leading-relaxed">
      后台管理的信息与操作较多，小屏幕放不下。请使用电脑或平板浏览器打开，操作会更清晰顺手。
    </p>

    <p class="text-base-content/50 text-xs">检测到手机尺寸屏幕</p>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .unsupported-fade {
    animation: unsupported-fade 0.6s ease-out both;
  }
}

@keyframes unsupported-fade {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
import { Outlet } from "react-router"

import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export function AdminLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={window.matchMedia("(min-width: 1024px)").matches}
      >
        <a
          href="#main-content"
          className="sr-only rounded-lg bg-background px-3 py-2 text-sm font-medium ring-3 ring-ring/30 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
        >
          跳到主内容
        </a>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
            <div className="mx-auto w-full max-w-(--layout-max) px-(--layout-gutter) py-4 md:py-6">
              <Outlet />
            </div>
          </main>
          <footer className="shrink-0 border-t px-(--layout-gutter) pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} hmilyld. All rights reserved.
          </footer>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

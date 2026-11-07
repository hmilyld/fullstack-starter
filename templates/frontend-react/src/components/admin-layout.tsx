import { Outlet } from "react-router"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"

export function AdminLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <a
          href="#main-content"
          className="sr-only rounded-lg bg-background px-3 py-2 text-sm font-medium ring-3 ring-ring/30 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
        >
          跳到主内容
        </a>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-auto px-4 py-6 outline-none md:px-6"
          >
            <Outlet />
          </main>
          <footer className="shrink-0 border-t px-4 py-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} hmilyld. All rights reserved.
          </footer>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

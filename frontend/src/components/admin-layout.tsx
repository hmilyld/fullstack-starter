import { Outlet } from "react-router"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"

export function AdminLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main className="flex-1 overflow-auto px-4 py-6 md:px-6">
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

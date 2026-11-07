import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ErrorBoundary } from "@/components/error-boundary"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { Toaster } from "@/components/ui/sonner"
import { useMediaQuery } from "@/hooks/use-media-query"
import { AuthProvider } from "@/lib/auth-context.tsx"
import { SiteConfigProvider } from "@/lib/site-config"

function AppToaster() {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  return (
    <Toaster
      position={isDesktop ? "bottom-right" : "top-center"}
      richColors
      closeButton
    />
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <SiteConfigProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
          <AppToaster />
        </SiteConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/lib/auth-context.tsx"
import { SiteConfigProvider } from "@/lib/site-config"
import { ErrorBoundary } from "@/components/error-boundary"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <SiteConfigProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
          <Toaster position="bottom-right" richColors closeButton />
        </SiteConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)

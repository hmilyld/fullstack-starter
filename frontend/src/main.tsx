import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Toaster } from "sonner"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { AuthProvider } from "@/lib/auth-context.tsx"
import { SiteConfigProvider } from "@/lib/site-config"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <SiteConfigProvider>
          <App />
          <Toaster position="top-center" />
        </SiteConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)

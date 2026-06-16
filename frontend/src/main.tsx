import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Toaster } from "sonner"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { AuthProvider } from "@/lib/auth-context.tsx"
import { SystemConfigProvider } from "@/lib/system-config-context.tsx"
import { SettingsLoader } from "@/components/settings-loader"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <SystemConfigProvider>
          <SettingsLoader>
            <App />
            <Toaster />
          </SettingsLoader>
        </SystemConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)

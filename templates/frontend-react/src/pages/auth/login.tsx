import { AuthShell } from "@/components/shared/auth-shell"
import { LoginForm } from "@/components/login-form"

export function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  )
}

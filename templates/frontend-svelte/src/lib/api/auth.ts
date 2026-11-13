import { apiClient } from "#lib/api/client.js"
import type { LoginResponse, RegisterPayload } from "#lib/types/auth.js"

export async function login(account: string, password: string) {
  return apiClient.post<LoginResponse>("/auth/login", { account, password })
}

export async function register(data: RegisterPayload) {
  return apiClient.post<LoginResponse | null>("/auth/register", data)
}

export async function logout() {
  return apiClient.post("/auth/logout")
}

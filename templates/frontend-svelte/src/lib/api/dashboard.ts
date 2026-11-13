import { apiClient } from "#lib/api/client.js"
import type { ActivityItem, DashboardStats } from "#lib/types/dashboard.js"

export async function getDashboardStats() {
  return apiClient.get<DashboardStats>("/dashboard/stats")
}

export async function getDashboardActivity() {
  return apiClient.get<ActivityItem[]>("/dashboard/activity")
}

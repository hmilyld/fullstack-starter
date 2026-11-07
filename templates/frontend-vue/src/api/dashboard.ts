import { apiClient } from "@/api/client"
import type { ActivityItem, DashboardStats } from "@/types/dashboard"

export async function getDashboardStats() {
  return apiClient.get<DashboardStats>("/dashboard/stats")
}

export async function getDashboardActivity() {
  return apiClient.get<ActivityItem[]>("/dashboard/activity")
}

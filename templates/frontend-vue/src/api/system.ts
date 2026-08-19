import { apiClient } from '@/api/client'
import type { PublicConfig, SystemConfig } from '@/types/system'

export async function getPublicConfig() {
  return apiClient.get<PublicConfig>('/public/config')
}

export async function getSystemConfig() {
  return apiClient.get<SystemConfig>('/system/config')
}

export async function updateSystemConfig(data: Partial<SystemConfig>) {
  return apiClient.put<SystemConfig>('/system/config', data)
}

export async function testEmail(email: string) {
  return apiClient.post('/system/test-email', { email })
}

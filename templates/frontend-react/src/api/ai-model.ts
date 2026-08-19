import { apiClient } from "@/api/client"
import type { AiModel, AiModelPreset, AiModelTestResult } from "@/types/ai-model"
import type { PaginatedData } from "@/types/common"

export async function getAiModels(params?: {
  search?: string
  page?: number
  pageSize?: number
}) {
  return apiClient.get<PaginatedData<AiModel>>("/ai-models", params)
}

export async function getAiModel(id: string) {
  return apiClient.get<AiModel>(`/ai-models/${id}`)
}

export async function createAiModel(data: Omit<AiModel, "id">) {
  return apiClient.post<AiModel>("/ai-models", data)
}

export async function updateAiModel(id: string, data: Partial<Omit<AiModel, "id">>) {
  return apiClient.put<AiModel>(`/ai-models/${id}`, data)
}

export async function deleteAiModel(id: string) {
  return apiClient.delete(`/ai-models/${id}`)
}

export async function getDefaultAiModel() {
  return apiClient.get<AiModel>("/ai-models/default")
}

export async function getAiModelByAlias(alias: string) {
  return apiClient.get<AiModel>(`/ai-models/by-alias/${alias}`)
}

export async function testAiModel(data: {
  apiUrl?: string
  apiKey?: string
  modelName?: string
  modelId?: string
}) {
  return apiClient.post<AiModelTestResult>("/ai-models/test", data)
}

export async function getAiModelPresets(params?: {
  search?: string
  group?: string
  isActive?: boolean
}) {
  return apiClient.get<AiModelPreset[]>("/ai-models/presets", params)
}

export async function getAiModelPresetGroups() {
  return apiClient.get<string[]>("/ai-models/presets/groups")
}

export async function getActiveAiModelPresets() {
  return apiClient.get<AiModelPreset[]>("/ai-models/presets/active")
}

export async function getAiModelPreset(id: string) {
  return apiClient.get<AiModelPreset>(`/ai-models/presets/${id}`)
}

export async function createAiModelPreset(data: Omit<AiModelPreset, "id">) {
  return apiClient.post<AiModelPreset>("/ai-models/presets", data)
}

export async function updateAiModelPreset(id: string, data: Partial<Omit<AiModelPreset, "id">>) {
  return apiClient.put<AiModelPreset>(`/ai-models/presets/${id}`, data)
}

export async function deleteAiModelPreset(id: string) {
  return apiClient.delete(`/ai-models/presets/${id}`)
}

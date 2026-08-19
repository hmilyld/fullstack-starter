export type AiModel = {
  id: string
  alias: string
  modelName: string
  apiUrl: string
  apiKey: string
  description: string
  isDefault: boolean
}

export type AiModelPreset = {
  id: string
  group: string
  alias: string
  modelName: string
  apiUrl: string
  description: string
  isActive: boolean
  sortOrder: number
}

export type AiModelTestResult = {
  success: boolean
  message: string
  responseTime: number | null
  model: string | null
}

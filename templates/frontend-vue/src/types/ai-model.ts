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

/** 连接测试请求体；新模型可用 apiUrl/apiKey，已保存模型只传 modelId */
export type AiModelTestPayload = {
  apiUrl?: string
  apiKey?: string
  modelName?: string
  modelId?: string
}

/** AI 预设列表查询参数 */
export type AiModelPresetQuery = {
  search?: string
  group?: string
  isActive?: boolean
}

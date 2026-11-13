/** 统一响应格式 */
export type ApiResponse<T = unknown> = {
  code: number
  message: string
  data: T
}

/** 分页数据 */
export type PaginatedData<T> = {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 通用分页查询参数 */
export type PageParams = {
  search?: string
  page?: number
  pageSize?: number
}

/** 通用查询参数；值为 undefined 或空字符串时不会拼进 URL */
export type QueryParams = Record<string, string | number | boolean | undefined>

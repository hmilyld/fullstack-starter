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

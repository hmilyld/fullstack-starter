/** 数据管理：完整导出 / 导入 */

export type ImportStatus = {
  id: string
  status: "queued" | "running" | "success" | "failed"
  message: string
  progress: number
}

/** 创建导入任务后的句柄；jobToken 只用于轮询该任务状态 */
export type ImportJobHandle = {
  jobId: string
  jobToken: string
  status: string
}

/** 导出成功后的结果：文件内容 + 服务端一次性生成的解压密码 */
export type ExportResult = {
  blob: Blob
  password: string
  filename: string
}

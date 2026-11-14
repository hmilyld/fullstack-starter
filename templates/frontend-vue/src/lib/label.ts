import i18n from "@/lib/i18n"

/**
 * 翻译内置标签，目录中没有对应键时原样返回后端数据。
 *
 * 注意：不要把后端名称作为 vue-i18n 的「默认消息」传入（`t(key, name)`），
 * 默认消息同样会被当作文案编译，名称里的 `@`、`|`、`{}` 会报错或被吞掉。
 */
export function translateOr(key: string, fallback: string): string {
  return i18n.global.te(key) ? i18n.global.t(key) : fallback
}

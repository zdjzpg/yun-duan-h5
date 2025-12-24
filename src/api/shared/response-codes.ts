 /**
 * API 响应状态码常量
 * 
 * 所有接口统一使用这些状态码，相同的 code 值在所有接口中表示相同的含义
 * 
 * @example
 * ```typescript
 * import { ApiResponseCode } from '@/api/shared/response-codes';
 * 
 * if (response.data.code === ApiResponseCode.SUCCESS) {
 *   // 处理成功逻辑
 * }
 * ```
 */
export const ApiResponseCode = {
  /**
   * 成功
   */
  SUCCESS: 0,

  /**
   * 未知错误/通用错误
   */
  UNKNOWN_ERROR: 1,

  /**
   * 参数错误/验证失败
   */
  INVALID_PARAMS: 400,

  /**
   * 未授权/需要登录
   */
  UNAUTHORIZED: 401,

  /**
   * 禁止访问/权限不足
   */
  FORBIDDEN: 403,

  /**
   * 资源不存在
   */
  NOT_FOUND: 404,

  /**
   * 服务器内部错误
   */
  SERVER_ERROR: 500,

  /**
   * 服务不可用
   */
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * API 响应状态码类型
 */
export type ApiResponseCode = typeof ApiResponseCode[keyof typeof ApiResponseCode];

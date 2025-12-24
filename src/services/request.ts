import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios'
import message from 'ant-design-vue/es/message'
import { setupMockAdapter } from '@/api/setup-mocks'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
})

// 本地开发启用剧场业务 Mock（与 a 项目完全一致的数据）
if (import.meta.env.DEV) {
  setupMockAdapter(service, { delay: 300, enable: true })
}

service.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
)

service.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const msg =
      error?.response?.data?.message ??
      error?.message ??
      '网络异常，请稍后重试'
    message.error(msg)
    return Promise.reject(error)
  },
)

export interface ApiResponse<T> {
  status: 'success' | 'error'
  result?: T
  messages?: string[]
}

function unwrapResponse<T>(raw: ApiResponse<T> | T): T {
  const data: any = raw

  if (data && typeof data === 'object') {
    // 新 H5 后端响应格式：{ status, result, messages }
    if ('status' in data) {
      const wrapped = data as ApiResponse<T>
      if (wrapped.status === 'success') {
        return wrapped.result as T
      }
      const msg =
        (wrapped.messages && wrapped.messages[0]) || '请求失败'
      message.error(msg)
      throw new Error(msg)
    }

    // 景区剧场业务 mock/后端响应格式：{ code, message, data }
    if ('code' in data && 'data' in data) {
      const wrapped = data as {
        code: number
        message?: string
        data: T
      }
      if (wrapped.code === 0) {
        return wrapped.data as T
      }
      const msg = wrapped.message || '请求失败'
      message.error(msg)
      throw new Error(msg)
    }
  }

  return data as T
}

export async function get<T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await service.get<ApiResponse<T> | T>(url, config)
  return unwrapResponse<T>(res.data)
}

export async function post<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await service.post<ApiResponse<T> | T>(
    url,
    data,
    config,
  )
  return unwrapResponse<T>(res.data)
}

export async function patch<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await service.patch<ApiResponse<T> | T>(
    url,
    data,
    config,
  )
  return unwrapResponse<T>(res.data)
}

export async function del<T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await service.delete<ApiResponse<T> | T>(url, config)
  return unwrapResponse<T>(res.data)
}

export default service

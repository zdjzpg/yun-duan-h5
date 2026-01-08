import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import message from 'ant-design-vue/es/message'
import { setupMockAdapter } from '@/api/setup-mocks'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
})

// 本地开发启用剧场业务 Mock
if (import.meta.env.DEV) {
  let enableMock = true

  if (typeof window !== 'undefined') {
    let devFlag: string | null = null

    // 1) 正常 URL 查询参数: http://host/path?dev=1#/...
    const search = window.location.search || ''
    if (search) {
      const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
      devFlag = params.get('dev')
    }

    // 2) Hash 路由中的查询参数: http://host/#/xxx?dev=1
    if (!devFlag && window.location.hash) {
      const hash = window.location.hash
      const queryIndex = hash.indexOf('?')
      if (queryIndex >= 0) {
        const hashQuery = hash.slice(queryIndex + 1)
        const hashParams = new URLSearchParams(hashQuery)
        devFlag = hashParams.get('dev')
      }
    }

    if (devFlag === '1') {
      enableMock = true
    }
  }

  setupMockAdapter(service, { delay: 300, enable: enableMock })
}

service.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
)

service.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const msg =
      error?.response?.data?.msg ??
      error?.response?.data?.message ??
      error?.message ??
      '网络异常，请稍后重试'
    message.error(msg)
    return Promise.reject(error)
  },
)

export interface ApiResponse<T> {
  successed: boolean
  msg?: string
  code?: number
  data?: T
}

function unwrapResponse<T>(raw: ApiResponse<T> | T): T {
  const data: any = raw

  if (data && typeof data === 'object') {
    // Mock：{ code, message, data }
    if ('code' in data && 'data' in data && !('successed' in data)) {
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

    // 真实后端响应格式：{ successed, msg, code, data }
    if ('successed' in data) {
      const wrapped = data as ApiResponse<T>
      if (wrapped.successed) {
        return wrapped.data as T
      }
      const msg = wrapped.msg || '请求失败'
      message.error(msg)
      throw new Error(msg)
    }
  }

  return data as T
}

export async function get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await service.get<ApiResponse<T> | T>(url, config)
  return unwrapResponse<T>(res.data)
}

export async function post<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await service.post<ApiResponse<T> | T>(url, data, config)
  return unwrapResponse<T>(res.data)
}

export async function put<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await service.put<ApiResponse<T> | T>(url, data, config)
  return unwrapResponse<T>(res.data)
}

export async function patch<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await service.patch<ApiResponse<T> | T>(url, data, config)
  return unwrapResponse<T>(res.data)
}

export async function del<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await service.delete<ApiResponse<T> | T>(url, config)
  return unwrapResponse<T>(res.data)
}

export default service

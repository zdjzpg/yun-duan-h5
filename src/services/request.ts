import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios'
import message from 'ant-design-vue/es/message'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
})

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

export async function get<T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await service.get<ApiResponse<T> | T>(url, config)
  const data: any = res.data

  if (data && typeof data === 'object' && 'status' in data) {
    const wrapped = data as ApiResponse<T>
    if (wrapped.status === 'success') {
      return wrapped.result as T
    }
    const msg =
      (wrapped.messages && wrapped.messages[0]) || '请求失败'
    message.error(msg)
    throw new Error(msg)
  }

  return data as T
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
  const respData: any = res.data

  if (respData && typeof respData === 'object' && 'status' in respData) {
    const wrapped = respData as ApiResponse<T>
    if (wrapped.status === 'success') {
      return wrapped.result as T
    }
    const msg =
      (wrapped.messages && wrapped.messages[0]) || '请求失败'
    message.error(msg)
    throw new Error(msg)
  }

  return respData as T
}

export default service

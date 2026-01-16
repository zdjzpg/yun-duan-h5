/**
 * Axios Mock Adapter 配置（复制自景区剧场业务的剧场模块，只保留剧场相关接口）
 */

import MockAdapter from 'axios-mock-adapter'
import type { AxiosInstance } from 'axios'
import type MockAdapterType from 'axios-mock-adapter'

// 剧场业务 Mock
import {
  setupVenueListMock,
  setupCreateVenueMock,
  setupVenueDetailMock,
  setupUpdateVenueMock,
  setupUpdateVenueStatusMock,
  setupDeleteVenueMock,
  setupVenueLockStatusMock,
  setupCopyVenueMock,

  // 演出管理
  setupTicketingShowDtoMocks,
} from './endpoints/theater/mocks'

export type SetupMockOptions = {
  /** Mock 响应延迟（毫秒），默认 300 */
  delay?: number
  /** 是否启用 Mock，默认 true */
  enable?: boolean
}

/**
 * 为指定 axios 实例挂载剧场相关 Mock
 */
export function setupMockAdapter(axiosInstance: AxiosInstance, options: SetupMockOptions = {}) {
  const { delay = 300, enable = true } = options

  if (!enable) {
    console.log('[Mock] disabled, using real API')
    return null
  }

  const mock = new MockAdapter(axiosInstance, {
    delayResponse: delay,
  })

  console.log('[Mock] theater endpoints enabled', {
    delay: `${delay}ms`,
  })

  // ==================== 场馆管理 ====================
  setupVenueListMock(mock)
  setupCreateVenueMock(mock)
  setupVenueDetailMock(mock)
  setupUpdateVenueMock(mock)
  setupUpdateVenueStatusMock(mock)
  setupDeleteVenueMock(mock)
  setupVenueLockStatusMock(mock)
  setupCopyVenueMock(mock)

  // ==================== 演出管理（新 Ticketing 接口） ====================
  setupTicketingShowDtoMocks(mock)

  // 其它未匹配的请求走真实后端
  mock.onAny().passThrough()

  return mock
}

export function resetMock(mock: MockAdapterType | null) {
  if (mock) {
    mock.reset()
    console.log('[Mock] reset')
  }
}

export function restoreMock(mock: MockAdapterType | null) {
  if (mock) {
    mock.restore()
    console.log('[Mock] restored')
  }
}

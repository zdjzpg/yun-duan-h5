/**
 * 场馆锁定检查 API（在 b 项目中基于统一的 request 封装）
 *
 * @module api/endpoints/theater/venue-lock
 */

import type {
  VenueLockStatus,
  CopyVenueRequest,
  CopyVenueResponse,
} from './types'
import { get, post } from '@/services/request'

/**
 * 检查场馆锁定状态
 */
export async function checkVenueLockStatus(
  venueId: string,
): Promise<VenueLockStatus> {
  return get<VenueLockStatus>(`/theater/venues/${venueId}/lock-status`)
}

/**
 * 复制场馆
 */
export async function copyVenue(
  request: CopyVenueRequest,
): Promise<CopyVenueResponse> {
  return post<CopyVenueResponse>('/theater/venues/copy', request)
}


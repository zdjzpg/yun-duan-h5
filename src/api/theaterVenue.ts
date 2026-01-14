import { post } from '@/services/request'
import type {
  Venue as DomainVenue,
  VenueZone as DomainVenueZone,
  VenueCapacityType,
  VenueType,
  VenueStatus,
} from '@/types/theater'

export type { VenueCapacityType, VenueType, VenueStatus }

export interface VenueZone extends DomainVenueZone {}

export interface Venue extends DomainVenue {}

export interface VenueListRequest {
  page?: number
  pageSize?: number
  keyword?: string
  status?: VenueStatus
}

export interface VenueListResponse {
  list: Venue[]
  total: number
  page: number
  pageSize: number
}

export type SaveVenueRequest = Omit<Venue, 'id'> & {
  id?: string
}

export interface SaveVenueResponse {
  id: string
}

export interface UpdateVenueStatusRequest {
  id: string
  status: VenueStatus
}

export interface DeleteVenueResponse {
  success: boolean
}

const REAL_BASE_URL = '/Ticketing/TicketingVenue'
const MOCK_BASE_URL = '/theater/venues'
const MOCK_VENUE_LIST_URL = '/theater/venues/list'
const MOCK_VENUE_DETAIL_URL = '/theater/venues/detail'
const MOCK_VENUE_UPDATE_STATUS_URL = '/theater/venues/update-status'
const MOCK_VENUE_DELETE_URL = '/theater/venues/delete'

const isVenueMockMode = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.location.href.includes('dev=1')
}

export async function fetchVenues(params: VenueListRequest): Promise<VenueListResponse> {
  if (isVenueMockMode()) {
    // Mock 模式：使用 POST + 本地 /theater/venues/list
    return post<VenueListResponse>(MOCK_VENUE_LIST_URL, params)
  }

  // 真实后端统一使用 POST
  return post<VenueListResponse>(`${REAL_BASE_URL}/VenueList`, params)
}

export async function saveVenue(data: SaveVenueRequest): Promise<SaveVenueResponse> {
  if (isVenueMockMode()) {
    // Mock 模式：无 id 时创建，有 id 时更新
    if (!data.id) {
      return post<SaveVenueResponse>(MOCK_BASE_URL, data)
    }

    const updated = await post<Venue>(`${MOCK_BASE_URL}/${data.id}`, data as Venue)
    return { id: updated.id }
  }

  return post<SaveVenueResponse>(`${REAL_BASE_URL}/SaveVenue`, data)
}

export async function fetchVenueDetail(id: string): Promise<Venue> {
  if (isVenueMockMode()) {
    // Mock 模式：使用 POST + 本地 /theater/venues/detail
    return post<Venue>(MOCK_VENUE_DETAIL_URL, { id })
  }

  return post<Venue>(`${REAL_BASE_URL}/VenueDetail`, { id })
}

export async function updateVenueStatus(id: string, status: VenueStatus): Promise<Venue> {
  const payload: UpdateVenueStatusRequest = { id, status }

  if (isVenueMockMode()) {
    // Mock 模式：使用 POST + 本地 /theater/venues/update-status
    return post<Venue>(MOCK_VENUE_UPDATE_STATUS_URL, payload)
  }

  return post<Venue>(`${REAL_BASE_URL}/UpdateVenueStatus`, payload)
}

export async function deleteVenue(id: string): Promise<DeleteVenueResponse> {
  if (isVenueMockMode()) {
    // Mock 模式：使用 POST + 本地 /theater/venues/delete
    return post<DeleteVenueResponse>(MOCK_VENUE_DELETE_URL, { id })
  }

  return post<DeleteVenueResponse>(`${REAL_BASE_URL}/DeleteVenue`, { id })
}

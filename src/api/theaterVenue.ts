import { get, post, patch, del, put } from '@/services/request'
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

const isVenueMockMode = (): boolean => {
  if (!import.meta.env.DEV) return false
  if (typeof window === 'undefined') return false
  return window.location.href.includes('dev=1')
}

export async function fetchVenues(params: VenueListRequest): Promise<VenueListResponse> {
  if (isVenueMockMode()) {
    return get<VenueListResponse>(MOCK_BASE_URL, { params })
  }

  return post<VenueListResponse>(`${REAL_BASE_URL}/VenueList`, params)
}

export async function saveVenue(data: SaveVenueRequest): Promise<SaveVenueResponse> {
  if (isVenueMockMode()) {
    // Mock mode: no id => create, has id => update
    if (!data.id) {
      return post<SaveVenueResponse>(MOCK_BASE_URL, data)
    }

    const updated = await put<Venue>(`${MOCK_BASE_URL}/${data.id}`, data as Venue)
    return { id: updated.id }
  }

  return post<SaveVenueResponse>(`${REAL_BASE_URL}/SaveVenue`, data)
}

export async function fetchVenueDetail(id: string): Promise<Venue> {
  if (isVenueMockMode()) {
    return get<Venue>(`${MOCK_BASE_URL}/${id}`)
  }

  return post<Venue>(`${REAL_BASE_URL}/VenueDetail`, { id })
}

export async function updateVenueStatus(id: string, status: VenueStatus): Promise<Venue> {
  const payload: UpdateVenueStatusRequest = { id, status }

  if (isVenueMockMode()) {
    return patch<Venue>(`${MOCK_BASE_URL}/${id}/status`, payload)
  }

  return post<Venue>(`${REAL_BASE_URL}/UpdateVenueStatus`, payload)
}

export async function deleteVenue(id: string): Promise<DeleteVenueResponse> {
  if (isVenueMockMode()) {
    return del<DeleteVenueResponse>(`${MOCK_BASE_URL}/${id}`)
  }

  return post<DeleteVenueResponse>(`${REAL_BASE_URL}/DeleteVenue`, { id })
}

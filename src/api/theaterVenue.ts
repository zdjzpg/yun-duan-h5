import { get, post, del, patch } from '@/services/request'
import type {
  Venue as DomainVenue,
  VenueZone as DomainVenueZone,
  VenueCapacityType,
  VenueType,
  VenueStatus,
  VenueSeatStatus,
  SeatLabel,
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

export interface CreateVenueBaseRequest {
  name: string
  type?: VenueType
  scenicId?: string
  address?: string
  description?: string
  capacityType: VenueCapacityType
}

export interface CreateVenueFreeSeatRequest extends CreateVenueBaseRequest {
  capacityType: 'free_seating'
  totalCapacity: number
}

export interface CreateVenueZoneCapacityRequest extends CreateVenueBaseRequest {
  capacityType: 'zone_capacity'
  zones: Array<{
    name: string
    capacity: number
    sort?: number
  }>
}

export interface CreateVenuePreciseSeatRequest extends CreateVenueBaseRequest {
  capacityType: 'precise_seat'
  zones: Array<{
    name: string
    shortName?: string
    color?: string
    floor?: string
    rows?: number
    seatsPerRow?: number
  }>
  seats: Array<{
    zoneId: string
    rowLabel: string
    seatLabel: string
    status: VenueSeatStatus
    label?: SeatLabel
    x: number
    y: number
  }>
}

export type CreateVenueRequest =
  | CreateVenueFreeSeatRequest
  | CreateVenueZoneCapacityRequest
  | CreateVenuePreciseSeatRequest

export interface CreateVenueResponse {
  id: string
}

export type UpdateVenueRequest = Partial<CreateVenueRequest> & {
  id: string
}

export interface UpdateVenueStatusRequest {
  id: string
  status: VenueStatus
}

export interface DeleteVenueResponse {
  success: boolean
}

export async function fetchVenues(params: VenueListRequest): Promise<VenueListResponse> {
  return get<VenueListResponse>('/theater/venues', { params })
}

export async function createVenue(data: CreateVenueRequest): Promise<CreateVenueResponse> {
  return post<CreateVenueResponse>('/theater/venues', data)
}

export async function fetchVenueDetail(id: string): Promise<Venue> {
  return get<Venue>(`/theater/venues/${id}`)
}

export async function updateVenue(data: UpdateVenueRequest): Promise<Venue> {
  const { id, ...payload } = data
  return patch<Venue>(`/theater/venues/${id}`, payload)
}

export async function updateVenueStatus(id: string, status: VenueStatus): Promise<Venue> {
  const payload: UpdateVenueStatusRequest = { id, status }
  return patch<Venue>(`/theater/venues/${id}/status`, payload)
}

export async function deleteVenue(id: string): Promise<DeleteVenueResponse> {
  return del<DeleteVenueResponse>(`/theater/venues/${id}`)
}

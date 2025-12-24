import { get, post, del, patch } from '@/services/request'

export type VenueCapacityType = 'free_seating' | 'zone_capacity' | 'precise_seat'

export type VenueType = 'indoor_theater' | 'outdoor_scene' | 'multifunctional' | 'other'

export type VenueStatus = 'active' | 'inactive'

export interface VenueZone {
  id: string
  venueId: string
  name: string
  shortName?: string
  color?: string
  floor?: string
  floorId?: string
  capacity?: number
  sort?: number
  rows?: number
  seatsPerRow?: number
  createdAt: string
  updatedAt: string
}

export interface Venue {
  id: string
  merchantId: string
  scenicId?: string
  name: string
  type?: VenueType
  address?: string
  description?: string
  capacityType: VenueCapacityType
  totalCapacity: number
  status: VenueStatus
  isLocked?: boolean
  referencedShowCount?: number
  zones?: VenueZone[]
  createdAt: string
  updatedAt: string
}

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

// 精确座位模式在 H5 先不支持创建，仅为兼容类型预留
export type CreateVenueRequest = CreateVenueFreeSeatRequest | CreateVenueZoneCapacityRequest

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


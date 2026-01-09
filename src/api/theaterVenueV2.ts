import { get } from '@/services/request'
import type { Venue, VenueListRequest, VenueListResponse } from '@/api/endpoints/theater/types'

export type { Venue, VenueListRequest, VenueListResponse }

export async function fetchTheaterVenues(params: VenueListRequest): Promise<VenueListResponse> {
  return get<VenueListResponse>('/theater/venues', { params })
}

export async function fetchTheaterVenueDetail(id: string): Promise<Venue> {
  return get<Venue>(`/theater/venues/${id}`)
}

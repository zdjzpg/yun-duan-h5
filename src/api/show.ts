import { get, post, patch, del } from '@/services/request'
import type {
  ShowListRequest,
  ShowListResponse,
  CreateShowRequest,
  CreateShowResponse,
  ShowDetailResponse,
  UpdateShowRequest,
  UpdateShowStatusRequest,
  DeleteShowResponse,
  ShowStatus,
  ShowType,
} from '@/api/endpoints/theater/types'

export type {
  ShowListRequest,
  ShowListResponse,
  CreateShowRequest,
  CreateShowResponse,
  ShowDetailResponse,
  UpdateShowRequest,
  UpdateShowStatusRequest,
  DeleteShowResponse,
  ShowStatus,
  ShowType,
}

export async function fetchShows(params: ShowListRequest): Promise<ShowListResponse> {
  return get<ShowListResponse>('/theater/shows', { params })
}

export async function createShow(data: CreateShowRequest): Promise<CreateShowResponse> {
  return post<CreateShowResponse>('/theater/shows', data)
}

export async function fetchShowDetail(id: string): Promise<ShowDetailResponse> {
  return get<ShowDetailResponse>(`/theater/shows/${id}`)
}

export async function updateShow(data: UpdateShowRequest): Promise<ShowDetailResponse> {
  const { id, ...payload } = data
  return patch<ShowDetailResponse>(`/theater/shows/${id}`, payload)
}

export async function updateShowStatus(id: string, status: ShowStatus): Promise<ShowDetailResponse> {
  const payload: UpdateShowStatusRequest = { id, status }
  return patch<ShowDetailResponse>(`/theater/shows/${id}/status`, payload)
}

export async function deleteShow(id: string): Promise<DeleteShowResponse> {
  return del<DeleteShowResponse>(`/theater/shows/${id}`)
}

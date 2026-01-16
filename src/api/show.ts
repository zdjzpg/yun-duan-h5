import { post } from '@/services/request'
import type {
  ShowListResponse,
  ShowStatus,
  ShowType,
  ShowDto,
  ShowListRequestDto,
} from '@/api/endpoints/theater/types'
import type { Show, ShowSession, ShowPriceTier } from '@/types/theater'

const TICKETING_SHOW_BASE = '/Ticketing/TicketingShow'

type TicketingShowListResponse = {
  List?: ShowDto[]
  Total?: number
}

export type {
  ShowListResponse,
  ShowStatus,
  ShowType,
  ShowDto,
  ShowListRequestDto,
}
export { mapShowDtoToLegacyDetail }

export async function fetchShows(requestBody: ShowListRequestDto): Promise<ShowListResponse> {
  const response = await post<TicketingShowListResponse>(
    `${TICKETING_SHOW_BASE}/ShowList`,
    requestBody,
  )
  const list = Array.isArray(response.List) ? response.List.map(mapShowDtoToListItem) : []
  return {
    list,
    total: response.Total ?? list.length,
    page: requestBody.Page ?? 1,
    pageSize: requestBody.PageSize ?? list.length,
  }
}

export async function saveShow(data: ShowDto): Promise<ShowDto> {
  return post<ShowDto>(`${TICKETING_SHOW_BASE}/SaveShow`, data)
}

// 详情查询：统一返回后端 ShowDto，由调用方按需转换
export async function fetchShowDetail(uid: number): Promise<ShowDto> {
  return post<ShowDto>(`${TICKETING_SHOW_BASE}/ShowDetail`, { Uid: uid })
}

export async function updateShowStatus(uid: number, status: ShowStatus): Promise<void> {
  const payload = {
    Uid: uid,
    ShowStatus: showStatusToDtoCode[status] ?? 0,
  }
  await post(`${TICKETING_SHOW_BASE}/UpdateShowStatus`, payload)
}

export async function deleteShow(uid: number): Promise<void> {
  await post(`${TICKETING_SHOW_BASE}/DeleteShow`, { Uid: uid })
}

export const showStatusToDtoCode: Record<ShowStatus, number> = {
  on_sale: 1,
  draft: 2,
  off_sale: 3,
  finished: 4,
}

const showStatusFromDtoCode: Record<string, ShowStatus> = {
  '1': 'on_sale',
  '2': 'draft',
  '3': 'off_sale',
  '4': 'finished',
}

const showTypeFromDtoCode: Record<number, ShowType> = {
  1: 'live_show',
  2: 'musical',
  3: 'drama',
  4: 'concert',
  5: 'other',
}

function mapShowDtoToListItem(dto: ShowDto): Show {
  return mapShowDtoToLegacyDetail(dto).show
}

function getNextSessionDate(sessions: ShowDto['Sessions'] | undefined): Date | undefined {
  if (!sessions || !sessions.length) return undefined
  const dates = sessions
    .map((session) => toDate(session.Date, session.StartTime))
    .filter((value): value is Date => !!value)
    .sort((a, b) => a.getTime() - b.getTime())
  return dates[0]
}

function toDate(date?: string | null, time?: string | null): Date | undefined {
  if (!date) return undefined
  const normalizedTime =
    time && time.length === 5
      ? `${time}:00`
      : time && time.length === 8
        ? time
        : '00:00:00'
  const isoString = `${date}T${normalizedTime}`
  const parsed = new Date(isoString)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed
}

function buildVenueId(uid: number): string {
  const padded = String(uid).padStart(3, '0')
  return `venue-${padded}`
}

function buildZoneId(uid: number): string {
  const padded = String(uid).padStart(3, '0')
  return `zone-${padded}`
}

function resolveZoneIdFromUid(value?: number | string | null): string | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return buildZoneId(value)
  }
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) {
      return buildZoneId(parsed)
    }
    return value
  }
  return undefined
}

function mapShowDtoToLegacyDetail(dto: ShowDto): {
  show: Show
  sessions: ShowSession[]
  priceTiers: ShowPriceTier[]
} {
  const sessions = dto.Sessions || []
  const showId = dto.Uid != null ? `show-${dto.Uid}` : `show-${Date.now()}`
  const venueId = dto.VenueUid != null ? buildVenueId(dto.VenueUid) : ''
  const nextSession = getNextSessionDate(sessions)
  const showType = showTypeFromDtoCode[dto.ShowType] ?? 'other'
  const statusKey = typeof dto.ShowStatus === 'number' ? String(dto.ShowStatus) : dto.ShowStatus
  const status = showStatusFromDtoCode[statusKey ?? ''] ?? 'draft'
  const createdAtFallback = dto.OnlineTime || new Date().toISOString()

  const show: Show = {
    id: showId,
    venueId,
    venueName: undefined,
    name: dto.ShowName,
    type: showType,
    coverImage: dto.CoverImages,
    description: dto.Description,
    status,
    sessionCount: sessions.length,
    nextSessionTime: nextSession?.toISOString(),
    createdAt: dto.OnlineTime || nextSession?.toISOString() || '',
  }

  const mappedSessions: ShowSession[] = sessions.map((session, index) => ({
    id: `${showId}-session-${index + 1}`,
    showId,
    venueId,
    date: session.Date,
    startTime: session.StartTime,
    durationMinutes: session.DurationMinutes,
    openTime: undefined,
    status: 'scheduled',
    createdAt: createdAtFallback,
    updatedAt: createdAtFallback,
  }))

  const priceTierSource = sessions[0]?.PriceTiers || []
  const mappedPriceTiers: ShowPriceTier[] = priceTierSource.map((tier, index) => {
    const zoneId = resolveZoneIdFromUid(tier.VenueZoneUid)
    return {
      id: `${showId}-tier-${index + 1}`,
      showId,
      name: tier.PriceTierName,
      price: tier.Price,
      zoneIds: zoneId ? [zoneId] : [],
      color: undefined,
      remark: undefined,
      createdAt: createdAtFallback,
      updatedAt: createdAtFallback,
    }
  })

  return {
    show,
    sessions: mappedSessions,
    priceTiers: mappedPriceTiers,
  }
}

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'
import message from 'ant-design-vue/es/message'
import {
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons-vue'

import YDatePicker from '@/components/YDatePicker.vue'
import TheaterCanvasSimplified from '@/components/theater/seat-map-editor/canvas/TheaterCanvasSimplified.vue'
import { fetchShows, fetchShowDetail, type ShowListRequest } from '@/api/show'
import { fetchVenueDetail } from '@/api/theaterVenue'
import type { Show, ShowSession, ShowPriceTier } from '@/types/theater'
import type { Seat, Stage } from '@/components/theater/seat-map-editor/types.simplified'

type CartSeat = Seat & {
  showId: string
  sessionId: string
  venueId: string
  priceTierName: string
  priceCents: number
}

type CartGroup = {
  priceTierId: string
  name: string
  priceCents: number
  color?: string
  seats: CartSeat[]
}

type CartSession = {
  sessionId: string
  showId: string
  showName: string
  session: ShowSession
  venueName: string
  groups: CartGroup[]
}

const loadingShows = ref(false)
const loadingDetail = ref(false)

const showSearchValue = ref('')
const shows = ref<Show[]>([])
const showsOriginal = ref<Show[]>([])
const pinnedShowId = ref<string>('')
const activeShowId = ref<string>('')

const showSessions = ref<ShowSession[]>([])
const showPriceTiers = ref<ShowPriceTier[]>([])
const sessionById = ref<Record<string, ShowSession>>({})

const venueName = ref<string>('')
const venueFloors = ref<Array<{ id: string; name: string }>>([])
const venueSeatsRaw = ref<any[]>([])
const venueStage = ref<Stage | undefined>(undefined)
const venueCache: Record<string, any> = {}
const venueNameById = ref<Record<string, string>>({})
const venueZoneIdsById = ref<Record<string, string[]>>({})

const activeDate = ref<Dayjs | null>(null)
const activeSessionId = ref<string>('')
const activeFloorId = ref<string>('')
const activePriceTierIds = ref<string[]>([])

const viewport = ref({
  offsetX: 400,
  offsetY: 300,
  scale: 1,
})

const canvasContainerRef = ref<HTMLDivElement | null>(null)
const canvasSize = ref({ width: 900, height: 620 })
const viewportInitialized = ref(false)

let resizeObserver: ResizeObserver | null = null
const observeCanvasSize = () => {
  if (!canvasContainerRef.value || typeof ResizeObserver === 'undefined') return

  resizeObserver?.disconnect()
  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    const rect = entry.contentRect
    canvasSize.value = {
      width: Math.max(360, Math.floor(rect.width)),
      height: Math.max(360, Math.floor(rect.height)),
    }

    if (!viewportInitialized.value) {
      resetView()
      viewportInitialized.value = true
    }
  })
  resizeObserver.observe(canvasContainerRef.value)
}

const selectedSeatIdsBySession = ref<Record<string, string[]>>({})
const seatAvailabilitySeed = ref(0)

const cartSeatSnapshots = ref<Record<string, CartSeat>>({})

function makeSessionSeatKey(sessionId: string, seatId: string): string {
  return `${sessionId}__${seatId}`
}

const SHOW_BUTTON_COUNT = 3
const showDropdownOpen = ref(false)
const suppressClearOnce = ref(false)

const dropdownShows = computed(() => {
  const input = showSearchValue.value.trim().toLowerCase()
  if (!input) return shows.value
  return shows.value.filter((s: Show) => s.name.toLowerCase().includes(input))
})

const defaultButtonShows = computed(() => {
  const base = showsOriginal.value.length ? showsOriginal.value : shows.value
  return base.slice(0, SHOW_BUTTON_COUNT)
})

const displayShows = computed(() => {
  if (!pinnedShowId.value) return defaultButtonShows.value
  const pinned = shows.value.find((s: Show) => s.id === pinnedShowId.value)
  const rest = defaultButtonShows.value.filter((s: Show) => s.id !== pinnedShowId.value)
  return pinned ? [pinned, ...rest] : rest
})

const sessionsByDate = computed(() => {
  const map = new Map<string, ShowSession[]>()
  showSessions.value.forEach((s: ShowSession) => {
    if (!map.has(s.date)) map.set(s.date, [])
    map.get(s.date)!.push(s)
  })
  Array.from(map.values()).forEach((list) =>
    list.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
  )
  return map
})

const availableDates = computed(() => Array.from(sessionsByDate.value.keys()).sort())

const activeSession = computed(
  () =>
    (sessionsForActiveDate.value || []).find((s: ShowSession) => s.id === activeSessionId.value) ||
    showSessions.value.find((s: ShowSession) => s.id === activeSessionId.value) ||
    null,
)

const sessionsForActiveDate = computed(() => {
  const current = activeDate.value
  const date = current ? current.format('YYYY-MM-DD') : ''
  if (!date) return []

  const list = [...(sessionsByDate.value.get(date) || [])]
  if (!list.length) return []

  const now = dayjs()
  const today = now.format('YYYY-MM-DD')

  // 当选择的是今天时：将已开场的挪到下面
  if (date === today) {
    const upcoming: ShowSession[] = []
    const past: ShowSession[] = []

    list.forEach((s: ShowSession) => {
      const start = dayjs(`${s.date} ${s.startTime}`)
      if (start.isBefore(now)) past.push(s)
      else upcoming.push(s)
    })

    upcoming.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    past.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))

    return [...upcoming, ...past]
  }

  // 其他日期：按开始时间升序
  list.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
  return list
})

const priceTiersForShow = computed(() => {
  const list = [...showPriceTiers.value]

  // 仅展示当前场次所属场馆的票档（无 zoneIds 的视为通用票档）
  const session = activeSession.value
  const venueId = session?.venueId
  if (venueId) {
    const zoneIds: string[] = venueZoneIdsById.value[venueId] || []
    const zoneSet = new Set<string>(zoneIds)
    if (zoneSet.size) {
      list.splice(
        0,
        list.length,
        ...list.filter((tier) => {
          const zones = tier.zoneIds || []
          if (!zones.length) return true
          return zones.some((id: string) => zoneSet.has(id))
        }),
      )
    }
  }

  list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  return list
})

const tierByZoneId = computed(() => {
  const map = new Map<string, ShowPriceTier>()
  priceTiersForShow.value.forEach((tier: ShowPriceTier) => {
    ;(tier.zoneIds || []).forEach((zoneId: string) => map.set(zoneId, tier))
  })
  return map
})

function hashString(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const seatAvailabilityForSession = computed(() => {
  const sessionId = activeSessionId.value
  const sold = new Set<string>()
  const showDisabled = new Set<string>()

  if (!sessionId) return { sold, showDisabled }

  for (const seat of venueSeatsRaw.value) {
    const seatId = String(seat.id)
    const v = hashString(`${sessionId}|${seatId}|${seatAvailabilitySeed.value}`) % 100
    if (v < 12) sold.add(seatId)
    else if (v < 16) showDisabled.add(seatId)
  }

  return { sold, showDisabled }
})

const seatsForCanvas = computed<Seat[]>(() => {
  const floorId = activeFloorId.value
  const { sold, showDisabled } = seatAvailabilityForSession.value
  const selectedTierIds = activePriceTierIds.value
  const hasTierFilter = selectedTierIds.length > 0

  return venueSeatsRaw.value
    .filter((s: any) => (floorId ? s.floorId === floorId : true))
    .map((s: any): Seat => {
      const tier = tierByZoneId.value.get(s.zoneId)
      const tierId = tier?.id
      const isSold = sold.has(String(s.id))
      const isShowDisabled = showDisabled.has(String(s.id))
      const isVenueDisabled = s.status === 'disabled'
      const matchesTierFilter = !hasTierFilter
        ? true
        : tierId
          ? selectedTierIds.includes(tierId)
          : false
      const isFilteredOutByTier = !matchesTierFilter

      return {
        id: String(s.id),
        x: Number(s.x),
        y: Number(s.y),
        floorId: String(s.floorId || ''),
        zoneId: s.zoneId ? String(s.zoneId) : undefined,
        zoneName: s.zoneName ? String(s.zoneName) : undefined,
        zoneColor: s.zoneColor ? String(s.zoneColor) : undefined,
        priceTierId: tierId,
        priceTierColor: tier?.color,
        rowLabel: String(s.rowLabel ?? ''),
        seatLabel: String(s.seatLabel ?? ''),
        status: isVenueDisabled || isFilteredOutByTier ? 'disabled' : 'available',
        locked: isVenueDisabled || isSold || isShowDisabled || isFilteredOutByTier,
        isSold,
        isShowDisabled,
      }
    })
})

const selectedSeatIds = computed(() => selectedSeatIdsBySession.value[activeSessionId.value] || [])

const currentFloorSeatCount = computed(() => {
  const ids = selectedSeatIds.value
  if (!ids.length) return 0
  const idSet = new Set<string>(ids)
  // `seatsForCanvas` 只包含当前楼层的座位
  return seatsForCanvas.value.filter((seat: Seat) => idSet.has(seat.id)).length
})

const cartSessions = computed<CartSession[]>(() => {
  const result: CartSession[] = []
  const allSelected = selectedSeatIdsBySession.value

  Object.keys(allSelected).forEach((sessionId: string) => {
    const seatIds = allSelected[sessionId]
    if (!seatIds || seatIds.length === 0) return

    const session = sessionById.value[sessionId]
    if (!session) return

    const show = shows.value.find((s: Show) => s.id === session.showId)
    const showName = show?.name || ''
    const venueName = venueNameById.value[session.venueId] || ''

    const groupsMap = new Map<string, CartGroup>()

    seatIds.forEach((seatId: string) => {
      const key = makeSessionSeatKey(sessionId, seatId)
      const seat = cartSeatSnapshots.value[key]
      if (!seat) return

      const tierId = seat.priceTierId || '__unassigned__'

      if (!groupsMap.has(tierId)) {
        groupsMap.set(tierId, {
          priceTierId: tierId,
          name: seat.priceTierName || '未分配票档',
          priceCents: seat.priceCents,
          color: seat.priceTierColor,
          seats: [],
        })
      }

      groupsMap.get(tierId)!.seats.push(seat)
    })

    const groups = Array.from(groupsMap.values())
    if (!groups.length) return

    groups.sort((a, b) => b.priceCents - a.priceCents)

    result.push({
      sessionId,
      showId: session.showId,
      showName,
      session,
      venueName,
      groups,
    })
  })

  result.sort((a, b) => {
    if (a.session.date === b.session.date) {
      return (a.session.startTime || '').localeCompare(b.session.startTime || '')
    }
    return a.session.date.localeCompare(b.session.date)
  })

  return result
})

const cartGroups = ref<CartGroup[]>([])

const cartSeatCount = computed(() => {
  const all = Object.values(selectedSeatIdsBySession.value) as string[][]
  return all.reduce((sum: number, ids: string[]) => sum + (ids ? ids.length : 0), 0)
})

const cartTotalCents = computed(() => {
  return cartSessions.value.reduce((sum: number, session: CartSession) => {
    const sessionTotal = session.groups.reduce(
      (inner: number, g: CartGroup) => inner + g.priceCents * g.seats.length,
      0,
    )
    return sum + sessionTotal
  }, 0)
})

function formatYuanFromCents(cents: number): string {
  return (cents / 100).toFixed(2)
}

function formatSessionText(session: ShowSession): string {
  if (!session) return ''
  const venueLabel = venueNameById.value[session.venueId] || '未知场馆'
  const start = session.startTime
  const end = dayjs(`${session.date} ${session.startTime}`)
    .add(session.durationMinutes || 0, 'minute')
    .format('HH:mm')
  return `${venueLabel} ${start}-${end}`
}

async function applyActiveSessionVenue() {
  const session = activeSession.value
  const venueId = session?.venueId
  if (!venueId) return

  let venue = venueCache[venueId]
  if (!venue) {
    venue = await fetchVenueDetail(venueId)
    venueCache[venueId] = venue
  }

  venueNameById.value[venueId] = venue.name
  venueZoneIdsById.value[venueId] = ((venue as any).zones || []).map((z: any) => String(z.id))

  venueName.value = venue.name
  venueFloors.value = (venue.floors || []).map((f: any, idx: number) => ({
    id: String(f.id),
    name: String(f.name || `F${idx + 1}`),
  }))
  venueSeatsRaw.value = (venue.seats || []) as any[]
  venueStage.value = (venue as any).seatMapConfig?.stage as Stage | undefined

  activeFloorId.value = venueFloors.value[0]?.id || ''
}

function ensureSessionSelection(sessionId: string) {
  if (!selectedSeatIdsBySession.value[sessionId]) {
    selectedSeatIdsBySession.value[sessionId] = []
  }
}

function updateSessionSelection(sessionId: string, ids: string[]) {
  selectedSeatIdsBySession.value[sessionId] = ids

  const idSet = new Set<string>(ids)
  const nextSnapshots: Record<string, CartSeat> = {}

  Object.entries(cartSeatSnapshots.value as Record<string, CartSeat>).forEach(
    ([key, seat]: [string, CartSeat]) => {
      if (!key.startsWith(`${sessionId}__`)) {
        // 其它场次的快照原样保留
        nextSnapshots[key] = seat
        return
      }

      const parts = key.split('__')
      const seatId = parts[1]
      if (seatId && idSet.has(seatId)) {
        // 当前场次里仍然选中的座位先保留，稍后如果有最新数据会覆盖
        nextSnapshots[key] = seat
      }
    },
  )

  if (sessionId === activeSessionId.value) {
    const seatById = new Map<string, Seat>(seatsForCanvas.value.map((s: Seat) => [s.id, s]))

    ids.forEach((id: string) => {
      const seat = seatById.get(id)
      if (!seat) return

      const tier = showPriceTiers.value.find((t: ShowPriceTier) => t.id === seat.priceTierId)
      const priceCents = tier ? Math.round(Number(tier.price) * 100) : 0

      nextSnapshots[makeSessionSeatKey(sessionId, id)] = {
        ...seat,
        showId: activeShowId.value,
        sessionId,
        venueId: activeSession.value?.venueId || '',
        priceTierName: tier?.name || '未分配票档',
        priceCents,
      }
    })
  }

  cartSeatSnapshots.value = nextSnapshots
}

function handleSeatSelect(nextIds: string[]) {
  const sessionId = activeSessionId.value
  if (!sessionId) return

  // 点击空白区域不清空已选座位（按右侧删除/清空按钮操作）
  if (nextIds.length === 0) return

  ensureSessionSelection(sessionId)

  const seatById = new Map<string, Seat>(seatsForCanvas.value.map((s: Seat) => [s.id, s]))
  const selectable = new Set<string>(
    seatsForCanvas.value.filter((s: Seat) => !s.locked).map((s: Seat) => s.id),
  )
  const filtered = nextIds.filter((id: string) => selectable.has(id))

  const hasOnlyLocked = nextIds.length > 0 && filtered.length === 0
  if (hasOnlyLocked) {
    const clickedId = nextIds.length === 1 ? nextIds[0] : ''
    const clickedSeat = clickedId ? seatById.get(clickedId) : undefined

    if (clickedSeat?.isSold) {
      message.warning('该座位已售')
      return
    }

    if (clickedSeat?.isShowDisabled) {
      message.warning('该座位已被演出禁用')
      return
    }

    message.warning('该座位不可售')
    return
  }

  const current = selectedSeatIdsBySession.value[sessionId] || []

  // 单个点击：切换选中状态（无需 Ctrl）
  if (filtered.length === 1) {
    const id = filtered[0] as string
    const seat = seatById.get(id)
    if (!seat || seat.locked) {
      message.warning('该座位不可售')
      return
    }

    const next = current.includes(id) ? current.filter((x: string) => x !== id) : [...current, id]
    updateSessionSelection(sessionId, next)
    return
  }

  // 框选/全选等：合并到已有选中
  const merged = Array.from(new Set<string>([...current, ...filtered]))

  selectedSeatIdsBySession.value[sessionId] = merged
  updateSessionSelection(sessionId, selectedSeatIdsBySession.value[sessionId])
}

function removeSeat(seatId: string, sessionIdOverride?: string) {
  const sessionId = sessionIdOverride || activeSessionId.value
  if (!sessionId) return
  ensureSessionSelection(sessionId)
  const current = selectedSeatIdsBySession.value[sessionId]
  const next = current.filter((id: string) => id !== seatId)
  updateSessionSelection(sessionId, next)
}

function removeGroup(priceTierId: string, sessionIdOverride?: string) {
  const sessionId = sessionIdOverride || activeSessionId.value
  if (!sessionId) return
  ensureSessionSelection(sessionId)

  const current = selectedSeatIdsBySession.value[sessionId]
  const next = current.filter((id: string) => {
    const key = makeSessionSeatKey(sessionId, id)
    const seat = cartSeatSnapshots.value[key]
    const tierId = seat?.priceTierId || '__unassigned__'
    return tierId !== priceTierId
  })

  updateSessionSelection(sessionId, next)
}

function clearSessionCart(sessionId: string) {
  if (!sessionId) return
  updateSessionSelection(sessionId, [])
}

function clearAllCart() {
  selectedSeatIdsBySession.value = {}
  cartSeatSnapshots.value = {}
}

function syncSelectionWithAvailability() {
  const selectable = new Set<string>(
    seatsForCanvas.value.filter((s: Seat) => !s.locked).map((s: Seat) => s.id),
  )
  const sessionId = activeSessionId.value
  if (!sessionId) return
  ensureSessionSelection(sessionId)
  const next = selectedSeatIdsBySession.value[sessionId].filter((id: string) => selectable.has(id))
  updateSessionSelection(sessionId, next)
}

function refreshSeatAvailability() {
  seatAvailabilitySeed.value += 1
  syncSelectionWithAvailability()
}

function zoom(delta: 1 | -1) {
  const factor = delta === 1 ? 1.1 : 1 / 1.1
  const nextScale = Math.min(3, Math.max(0.5, viewport.value.scale * factor))
  viewport.value = { ...viewport.value, scale: nextScale }
}

function resetView() {
  const floorId = activeFloorId.value
  const seats = venueSeatsRaw.value.filter((s: any) => (floorId ? s.floorId === floorId : true))
  const stage = venueStage.value

  if (!seats.length && !stage) {
    viewport.value = {
      offsetX: canvasSize.value.width / 2,
      offsetY: canvasSize.value.height / 2,
      scale: 1,
    }
    return
  }

  const seatSize = 20
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  seats.forEach((s: any) => {
    const x = Number(s.x)
    const y = Number(s.y)
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + seatSize)
    maxY = Math.max(maxY, y + seatSize)
  })

  if (stage) {
    const stageWidth = stage.width || 0
    const stageHeight = stage.height || 40
    const left = stage.x - stageWidth / 2
    const right = stage.x + stageWidth / 2
    const top = stage.y - stageHeight / 2
    const bottom = stage.y + stageHeight / 2

    minX = Math.min(minX, left)
    maxX = Math.max(maxX, right)
    minY = Math.min(minY, top)
    maxY = Math.max(maxY, bottom)
  }

  const boundsWidth = Math.max(maxX - minX, 1)
  const boundsHeight = Math.max(maxY - minY, 1)

  // 适当减小 padding，让初始缩放更大一些
  const padding = 40
  const cw = Math.max(canvasSize.value.width, padding * 2 + 1)
  const ch = Math.max(canvasSize.value.height, padding * 2 + 1)

  const scaleX = (cw - padding * 2) / boundsWidth
  const scaleY = (ch - padding * 2) / boundsHeight
  // 在不超出视口的前提下放大约 40% ，再相当于点两次放大（1.1^2≈1.21）
  const baseScale = Math.min(scaleX, scaleY)
  const scale = Math.min(baseScale * 1.4 * 1.6, 3)

  const centerX = minX + boundsWidth / 2
  const centerY = minY + boundsHeight / 2

  viewport.value = {
    offsetX: cw / 2 - centerX * scale,
    // 顶部对齐到一个固定的上边距，让舞台优先显示在最上方
    offsetY: 60 - minY * scale,
    scale,
  }
}

function handleViewportChange(next: any) {
  viewport.value = next
}

async function loadShows() {
  try {
    loadingShows.value = true
    const params: ShowListRequest = { page: 1, pageSize: 50 }
    const res = await fetchShows(params)
    shows.value = res.list || []
    showsOriginal.value = res.list || []
    if (pinnedShowId.value && !shows.value.some((s: Show) => s.id === pinnedShowId.value)) {
      pinnedShowId.value = ''
    }
  } catch (err) {
    console.error(err)
  } finally {
    loadingShows.value = false
  }
}

async function loadShowDetail(showId: string) {
  try {
    loadingDetail.value = true

    const res = await fetchShowDetail(showId)
    activeShowId.value = res.show.id
    const sessions = res.sessions || []
    showSessions.value = sessions
    showPriceTiers.value = res.priceTiers || []

    sessions.forEach((s: ShowSession) => {
      sessionById.value[s.id] = s
    })

    // 预加载当前演出的所有场馆信息（多场馆场次）
    const venueIds: string[] = Array.from(
      new Set<string>(
        (showSessions.value || [])
          .map((s: ShowSession) => s.venueId)
          .filter((id: string): id is string => !!id),
      ),
    )

    await Promise.all(
      venueIds.map(async (venueId) => {
        if (!venueId || venueCache[venueId]) return
        const venue = await fetchVenueDetail(venueId)
        venueCache[venueId] = venue
        venueNameById.value[venueId] = venue.name
        venueZoneIdsById.value[venueId] = ((venue as any).zones || []).map((z: any) => String(z.id))
      }),
    )

    const dates = availableDates.value
    const firstDate = dates[0] || showSessions.value[0]?.date
    activeDate.value = firstDate ? dayjs(firstDate) : null

    const firstSession = sessionsForActiveDate.value[0] || showSessions.value[0]
    activeSessionId.value = firstSession?.id || ''
    if (activeSessionId.value) ensureSessionSelection(activeSessionId.value)

    // 根据当前场次的场馆应用座位图与楼层
    await applyActiveSessionVenue()

    activePriceTierIds.value = []
    seatAvailabilitySeed.value = 0
    resetView()
    viewportInitialized.value = true
  } catch (err) {
    console.error(err)
  } finally {
    loadingDetail.value = false
  }
}

watch(
  () => activeDate.value?.format('YYYY-MM-DD'),
  (date) => {
    if (!date) return
    const next = sessionsForActiveDate.value[0]
    if (next && next.id !== activeSessionId.value) {
      activeSessionId.value = next.id
      ensureSessionSelection(next.id)
      syncSelectionWithAvailability()
      applyActiveSessionVenue()
    }
  },
)

watch(
  () => activeSessionId.value,
  (id: string) => {
    if (!id) return
    ensureSessionSelection(id)
    syncSelectionWithAvailability()
    applyActiveSessionVenue()
  },
)

onMounted(async () => {
  observeCanvasSize()
  await loadShows()

  const first = shows.value[0]
  if (first) {
    await loadShowDetail(first.id)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

async function handleShowSelected(showId: string) {
  if (!showId) return
  pinnedShowId.value = ''
  suppressClearOnce.value = true

  const selected = shows.value.find((s: Show) => s.id === showId)
  showSearchValue.value = selected?.name || ''

  showDropdownOpen.value = false
  window.setTimeout(() => {
    suppressClearOnce.value = false
  }, 0)
  await loadShowDetail(showId)
}

async function handleShowButtonClick(showId: string) {
  if (!showId) return
  pinnedShowId.value = ''
  showDropdownOpen.value = false
  showSearchValue.value = ''
  await loadShowDetail(showId)
}

async function handleShowClear() {
  showSearchValue.value = ''
  pinnedShowId.value = ''
  showDropdownOpen.value = false
  const first = (showsOriginal.value.length ? showsOriginal.value : shows.value)[0]
  if (first) {
    await loadShowDetail(first.id)
  }
}

function togglePriceTier(tierId: string) {
  const current = activePriceTierIds.value
  if (current.includes(tierId)) {
    activePriceTierIds.value = current.filter((id: string) => id !== tierId)
  } else {
    activePriceTierIds.value = [...current, tierId]
  }
}

watch(
  () => activePriceTierIds.value,
  () => {
    syncSelectionWithAvailability()
  },
)

watch(
  () => showSearchValue.value,
  (val, prev) => {
    if (suppressClearOnce.value) return
    if (prev && !val) {
      handleShowClear()
    }
  },
)
</script>

<template>
  <div class="ticketing-sale">
    <a-card class="ticketing-sale__filters" :bordered="false">
      <div class="filter-row">
        <div class="filter-label">演出名称：</div>
        <div class="filter-content">
          <a-space :size="10" wrap>
            <a-space :size="10" wrap class="show-buttons">
              <a-button
                v-for="showItem in displayShows"
                :key="showItem.id"
                :type="activeShowId === showItem.id ? 'primary' : 'default'"
                :ghost="activeShowId === showItem.id"
                @click="handleShowButtonClick(showItem.id)"
              >
                {{ showItem.name }}
              </a-button>
            </a-space>

            <a-dropdown
              :open="showDropdownOpen"
              :trigger="['click']"
              @openChange="(open: boolean) => (showDropdownOpen = open)"
            >
              <a-input
                v-model:value="showSearchValue"
                allow-clear
                placeholder="请输入演出名称匹配具体的演出"
                style="width: 360px"
                @focus="showDropdownOpen = true"
                @click="showDropdownOpen = true"
              >
                <template #prefix>
                  <SearchOutlined />
                </template>
              </a-input>
              <template #overlay>
                <div class="show-dropdown">
                  <a-menu @click="(e: any) => handleShowSelected(String(e.key))">
                    <a-menu-item v-for="s in dropdownShows" :key="s.id">
                      {{ s.name }}
                    </a-menu-item>
                  </a-menu>
                </div>
              </template>
            </a-dropdown>
          </a-space>
        </div>
      </div>

      <div class="filter-row">
        <div class="filter-label">演出日期：</div>
        <div class="filter-content">
          <YDatePicker
            v-model:value="activeDate"
            style="width: 160px"
            placeholder="请选择"
            :disabled-date="
              (current: Dayjs) => !availableDates.includes(current.format('YYYY-MM-DD'))
            "
          />
        </div>
      </div>

      <div class="filter-row">
        <div class="filter-label">演出场次：</div>
        <div class="filter-content">
          <a-select v-model:value="activeSessionId" style="width: 220px" placeholder="请选择">
            <a-select-option v-for="s in sessionsForActiveDate" :key="s.id" :value="s.id">
              {{ formatSessionText(s) }}
            </a-select-option>
          </a-select>
        </div>
      </div>

      <div class="filter-row">
        <div class="filter-label">演出票档：</div>
        <div class="filter-content filter-content--between">
          <a-space :size="10" wrap class="tier-buttons">
            <a-select
              v-if="venueFloors.length > 1"
              v-model:value="activeFloorId"
              style="width: 120px"
              placeholder="楼层"
            >
              <a-select-option v-for="f in venueFloors" :key="f.id" :value="f.id">
                {{ f.name }}
              </a-select-option>
            </a-select>

            <a-button
              v-for="tier in priceTiersForShow.slice(0, 3)"
              :key="tier.id"
              class="tier-button"
              :class="{ 'tier-button--active': activePriceTierIds.includes(tier.id) }"
              :style="tier.color ? { '--tier-color': tier.color } : {}"
              @click="togglePriceTier(tier.id)"
            >
              {{ tier.name }} ￥{{ tier.price }}
            </a-button>

            <a-dropdown v-if="priceTiersForShow.length > 3">
              <a-button>更多</a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item
                    v-for="tier in priceTiersForShow.slice(3)"
                    :key="tier.id"
                    @click="togglePriceTier(tier.id)"
                  >
                    {{ tier.name }} ￥{{ tier.price }}
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-space>

          <a-button type="primary" :loading="loadingDetail" @click="refreshSeatAvailability">
            <template #icon><ReloadOutlined /></template>
            刷新座位
          </a-button>
        </div>
      </div>
    </a-card>

    <div class="ticketing-sale__body">
      <a-card class="ticketing-sale__canvas" :bordered="false">
        <div class="canvas-header">
          <div class="canvas-title">
            <span class="canvas-title__name">{{ venueName || '座位图' }}</span>
            <span class="canvas-title__sub">已选 {{ currentFloorSeatCount }} 个</span>
          </div>
          <div class="canvas-actions">
            <a-button @click="zoom(1)">
              <template #icon><ZoomInOutlined /></template>
            </a-button>
            <a-button @click="zoom(-1)">
              <template #icon><ZoomOutOutlined /></template>
            </a-button>
            <a-button @click="resetView">重置</a-button>
          </div>
        </div>

        <div class="canvas-container" ref="canvasContainerRef">
          <template v-if="venueSeatsRaw.length">
            <TheaterCanvasSimplified
              :seats="seatsForCanvas"
              :stage="venueStage"
              :enable-stage-interaction="false"
              :enable-seat-drag="false"
              :selected-seat-ids="selectedSeatIds"
              :selected-element="null"
              :width="canvasSize.width"
              :height="canvasSize.height"
              :show-grid="false"
              :enable-snap="false"
              :show-seat-labels="true"
              :viewport="viewport"
              @seat-select="handleSeatSelect"
              @viewport-change="handleViewportChange"
            />
          </template>
          <a-empty v-else description="该演出场馆暂不支持精确选座" />
        </div>
      </a-card>

      <a-card class="ticketing-sale__cart" :bordered="false">
        <div class="cart-header">
          <div class="cart-title">消费清单({{ cartSeatCount }})</div>
          <a-button type="text" :disabled="!cartSeatCount" @click="clearAllCart">
            <template #icon><DeleteOutlined /></template>
          </a-button>
        </div>

        <div class="cart-session" v-if="false">
          <a-card size="small" class="cart-session-card" :body-style="{ padding: '10px 12px' }">
            <div class="cart-session-card__row">
              <div class="cart-session-card__text">
                演出场次：{{ formatSessionText(activeSession) }}
              </div>
              <a-button
                type="text"
                size="small"
                :disabled="!cartSeatCount"
                @click="clearSessionCart"
              >
                <template #icon><DeleteOutlined /></template>
              </a-button>
            </div>
          </a-card>
        </div>

        <div class="cart-content">
          <template v-if="cartSessions.length">
            <div
              v-for="sessionCart in cartSessions"
              :key="sessionCart.sessionId"
              class="cart-session"
            >
              <a-card size="small" class="cart-session-card" :body-style="{ padding: '10px 12px' }">
                <div class="cart-session-card__row">
                  <div class="cart-session-card__text">
                    演出场次：
                    {{ sessionCart.showName ? sessionCart.showName + ' ' : ''
                    }}{{ formatSessionText(sessionCart.session) }}
                  </div>
                  <a-button
                    type="text"
                    size="small"
                    @click="clearSessionCart(sessionCart.sessionId)"
                  >
                    <template #icon><DeleteOutlined /></template>
                  </a-button>
                </div>
              </a-card>

              <a-card
                v-for="group in sessionCart.groups"
                :key="`${sessionCart.sessionId}-${group.priceTierId}`"
                size="small"
                class="cart-tier-card"
                :body-style="{ padding: '10px 12px' }"
              >
                <div class="cart-tier-card__header">
                  <div class="cart-tier-card__title">
                    {{ group.name }} ¥{{ formatYuanFromCents(group.priceCents) }}
                  </div>
                  <a-button
                    type="text"
                    size="small"
                    @click="removeGroup(group.priceTierId, sessionCart.sessionId)"
                  >
                    <template #icon><DeleteOutlined /></template>
                  </a-button>
                </div>

                <div class="cart-tier-card__seats">
                  <a-tag
                    v-for="seat in group.seats"
                    :key="seat.id"
                    color="blue"
                    closable
                    @close.prevent="removeSeat(seat.id, sessionCart.sessionId)"
                  >
                    {{ seat.zoneName || '' }} {{ seat.rowLabel }}排{{ seat.seatLabel }}座
                  </a-tag>
                </div>
              </a-card>
            </div>
          </template>

          <template v-else-if="false">
            <a-card
              v-for="group in cartGroups"
              :key="group.priceTierId"
              size="small"
              class="cart-tier-card"
              :body-style="{ padding: '10px 12px' }"
            >
              <div class="cart-tier-card__header">
                <div class="cart-tier-card__title">
                  {{ group.name }} ￥{{ formatYuanFromCents(group.priceCents) }}
                </div>
                <a-button type="text" size="small" @click="removeGroup(group.priceTierId)">
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </div>

              <div class="cart-tier-card__seats">
                <a-tag
                  v-for="seat in group.seats"
                  :key="seat.id"
                  color="blue"
                  closable
                  @close.prevent="removeSeat(seat.id)"
                >
                  {{ seat.zoneName || '' }} {{ seat.rowLabel }}排{{ seat.seatLabel }}座
                </a-tag>
              </div>
            </a-card>
          </template>
          <a-empty v-else description="请选择座位" />
        </div>

        <div class="cart-footer">
          <div class="total">
            <span class="total__amount">￥{{ formatYuanFromCents(cartTotalCents) }}</span>
          </div>
          <a-button
            type="primary"
            :disabled="!cartSeatCount"
            @click="message.success('已提交结算（演示）')"
          >
            去结算
          </a-button>
        </div>
      </a-card>
    </div>
  </div>
</template>

<style scoped lang="less">
.ticketing-sale {
  padding: 16px;
  background: #f5f5f5;
  min-height: 100vh;
  height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  grid-template-rows: auto minmax(0, 1fr);
  column-gap: 16px;
  row-gap: 16px;
  box-sizing: border-box;
}

.ticketing-sale__filters {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  border-radius: 8px;
}

.ticketing-sale__filters :deep(.ant-select-selector) {
  border-radius: 6px;
}

.show-dropdown {
  width: 360px;
  max-height: 360px;
  overflow: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow:
    0 6px 16px 0 rgba(0, 0, 0, 0.08),
    0 3px 6px -4px rgba(0, 0, 0, 0.12),
    0 9px 28px 8px rgba(0, 0, 0, 0.05);
}

.filter-row {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
}

.filter-label {
  width: 90px;
  color: rgba(0, 0, 0, 0.65);
  padding-top: 6px;
  flex: 0 0 auto;
}

.filter-content {
  flex: 1;
}

.filter-content--between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.ticketing-sale__body {
  display: contents;
}

.ticketing-sale__canvas {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  flex: 1;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
}

.ticketing-sale__canvas :deep(.ant-card-body) {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.canvas-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.canvas-title__name {
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.canvas-title__sub {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.canvas-actions {
  display: flex;
  gap: 8px;
}

.canvas-container {
  flex: 1;
  min-height: 0;
  background: #f7f7f7;
  border-radius: 8px;
  overflow: hidden;
}

.ticketing-sale__cart {
  grid-column: 2 / 3;
  grid-row: 1 / 3;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tier-buttons :deep(.tier-button.ant-btn) {
  border-color: var(--tier-color, #d9d9d9);
  color: var(--tier-color, rgba(0, 0, 0, 0.88));
}

.tier-buttons :deep(.tier-button--active.ant-btn) {
  background-color: var(--tier-color, #08d);
  color: #ffffff;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 24px;
}

.cart-title {
  font-size: 16px;
  font-weight: 600;
}
.cart-session {
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  margin-bottom: 12px;
}
.cart-session__title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.cart-session__name {
  font-weight: 600;
  color: #08d;
}

.cart-session-card {
  background: #f5f5f5;
  border: 1px solid #f0f0f0;
  border-radius: 4px 4px 0 0;
}

.cart-session-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cart-session-card__text {
  color: #08d;
  font-weight: 600;
  font-size: 13px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cart-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-right: 2px;
  padding: 0 24px;
}
.cart-tier-card {
  border-radius: 0;
}
.cart-tier-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.cart-tier-card__title {
  font-weight: 600;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #08d;
}

.cart-tier-card__seats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cart-footer {
  padding: 12px 24px 0;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total__amount {
  font-size: 24px;
  font-weight: 600;
  color: #ff4d4f;
}
</style>
<style>
.cart-tier-card .ant-card-body {
  border-radius: 0;
  border: none;
}
/* TMS 销售清单右侧：底部合计固定，列表滚动 */
.ticketing-sale__cart .ant-card-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px 0;
}
.show-buttons .ant-btn {
  height: 32px;
}
.filter-content .ant-dropdown-trigger {
  margin-top: 5px;
}
</style>

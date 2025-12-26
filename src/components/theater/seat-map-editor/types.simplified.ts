/**
 * 精确座位编辑器简化类型
 */

import type { VenueSeatStatus, SeatLabel, SeatDisabledReason } from '@/types/theater'

export type Seat = {
  id: string
  x: number
  y: number
  floorId: string
  zoneId?: string
  zoneName?: string
  zoneColor?: string
  priceTierId?: string
  priceTierColor?: string
  rowLabel: string
  seatLabel: string
  status: VenueSeatStatus
  disabledReason?: SeatDisabledReason
  label?: SeatLabel
  groupId?: string
  locked?: boolean
}

export type Floor = {
  id: string
  name: string
  level: number
}

export type Stage = {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  angle?: number
  color?: string
  shape?: 'rect' | 'trapezoid' | 'arc'
  // 可选：舞台在剧场中的语义位置（顶部居中等），主要用于导入/导出和对齐
  position?: string
}

export type Zone = {
  id: string
  venueId: string
  floorId: string
  name: string
  shortName?: string
  color: string
  order: number
}

export type TheaterData = {
  id: string
  name: string
  floors: Floor[]
  seats: Seat[]
  stage?: Stage
  zones?: Zone[]
  metadata?: {
    createdAt: string
    updatedAt?: string
  }
}

export type SelectedElement =
  | { type: 'seat'; id: string }
  | { type: 'seats'; ids: string[] }
  | { type: 'stage'; id: string }
  | null

export type BatchGenerateConfig = {
  startRow: number
  startSeat: number
  rowCount: number
  seatsPerRow: number
  rowSpacing: number
  seatSpacing: number
  zone?: string
  seatType?: 'standard' | 'vip' | 'couple' | 'wheelchair'
}

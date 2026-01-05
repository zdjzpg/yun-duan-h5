import type { Seat, Zone, PriceTier } from '../types.simplified'
import type { VenueSeatStatus, SeatDisabledReason } from '@/types/theater'

const SEAT_SIZE = 30

export function generateBatchSeats(
  config: {
    startRow: number
    startSeat: number
    rowCount: number
    seatsPerRow: number
    rowSpacing: number
    seatSpacing: number
    zone?: string
    seatType?: 'standard' | 'vip' | 'couple' | 'wheelchair'
    status?: VenueSeatStatus
    disabledReason?: SeatDisabledReason
  },
  floorId: string,
  startX: number,
  startY: number,
): Seat[] {
  const seats: Seat[] = []

  const gridCellWidth = SEAT_SIZE + config.seatSpacing
  const gridCellHeight = SEAT_SIZE + config.rowSpacing

  const totalWidth = config.seatsPerRow * gridCellWidth
  const totalHeight = config.rowCount * gridCellHeight

  const actualStartX = startX - totalWidth / 2
  const actualStartY = startY - totalHeight / 2

  for (let r = 0; r < config.rowCount; r++) {
    for (let s = 0; s < config.seatsPerRow; s++) {
      const x = actualStartX + s * gridCellWidth
      const y = actualStartY + r * gridCellHeight

      const seat: Seat = {
        id: `seat_${Date.now()}_${r}_${s}`,
        x,
        y,
        floorId,
        rowLabel: String(config.startRow + r),
        seatLabel: String(config.startSeat + s),
        status: (config.status as VenueSeatStatus) || 'available',
      }

      if (seat.status === 'disabled' && config.disabledReason) {
        seat.disabledReason = config.disabledReason
      }

      seats.push(seat)
    }
  }

  return seats
}

/**
 * 基于场馆座区自动生成演出票档
 *
 * - 每个座区生成一个对应的票档
 * - 票档继承座区的名称 / 颜色 / 楼层 / 显示顺序
 * - 默认票价为 0，后续在演出管理中配置
 */
export function generatePriceTiersFromZones(zones: Zone[], showId: string): PriceTier[] {
  if (!Array.isArray(zones) || zones.length === 0) {
    return []
  }

  return zones.map((zone) => ({
    id: `tier-${zone.id}-${Date.now()}`,
    showId,
    floorId: zone.floorId,
    zoneId: zone.id,
    name: zone.name,
    price: 0,
    color: zone.color,
    order: zone.order,
  }))
}

/**
 * 根据座区自动将座位分配到对应票档
 *
 * - seat.zoneId === priceTier.zoneId 时进行关联
 * - 同步写入座位的 priceTierId / priceTierColor
 */
export function autoAssignSeatsToPriceTiers(seats: Seat[], priceTiers: PriceTier[]): Seat[] {
  if (!Array.isArray(seats) || !Array.isArray(priceTiers) || seats.length === 0) {
    return seats
  }

  const tierByZoneId = new Map<string, PriceTier>()
  priceTiers.forEach((tier) => {
    if (tier.zoneId) {
      tierByZoneId.set(tier.zoneId, tier)
    }
  })

  return seats.map((seat) => {
    if (!seat.zoneId) return seat
    const matchedTier = tierByZoneId.get(seat.zoneId)
    if (!matchedTier) return seat

    return {
      ...seat,
      priceTierId: matchedTier.id,
      priceTierColor: matchedTier.color,
    }
  })
}

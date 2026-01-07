import type { Seat } from '../types.simplified'
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

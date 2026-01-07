/**
 * 座位图编辑器 - 数据校验工具
 *
 * @module components/theater/seat-map-editor/validation.utils
 */

import type { TheaterData } from '../types.simplified'

/**
 * 校验错误类型
 */
export type ValidationErrorType =
  | 'duplicate_seat' // 座位重复
  | 'missing_stage' // 缺少舞台
  | 'no_seats' // 没有座位

/**
 * 校验错误
 */
export type ValidationError = {
  /** 错误类型 */
  type: ValidationErrorType

  /** 错误消息 */
  message: string

  /** 额外信息（可选） */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>
}

/**
 * 校验结果
 */
export type ValidationResult = {
  /** 是否通过校验 */
  success: boolean

  /** 错误列表 */
  errors: ValidationError[]
}

/**
 * 校验座位图数据
 *
 * - 必须存在舞台
 * - 必须至少有 1 个座位
 * - 同一楼层内「排号 + 座号」不能重复
 */
export function validateTheaterData(data: TheaterData): ValidationResult {
  const errors: ValidationError[] = []

  // ==================== 校验 A：必须有舞台 ====================
  if (!data.stage) {
    errors.push({
      type: 'missing_stage',
      message: '座位图必须包含舞台，请先添加舞台',
    })
  }

  // ==================== 校验 B：至少有 1 个座位 ====================
  if (!data.seats || data.seats.length === 0) {
    errors.push({
      type: 'no_seats',
      message: '座位图至少需要一个座位',
    })
  }

  // ==================== 校验 C：座位唯一性（同一楼层内，排号+座号不能重复） ====================
  if (data.seats && data.seats.length > 0) {
    // 按楼层分组
    const seatsByFloor = new Map<
      string,
      Array<{ rowLabel: string; seatLabel: string; id: string }>
    >()

    for (const seat of data.seats) {
      const floorId = seat.floorId
      if (!seatsByFloor.has(floorId)) {
        seatsByFloor.set(floorId, [])
      }
      seatsByFloor.get(floorId)!.push({
        rowLabel: seat.rowLabel,
        seatLabel: seat.seatLabel,
        id: seat.id,
      })
    }

    // 检查每个楼层内的座位唯一性
    for (const [floorId, floorSeats] of seatsByFloor.entries()) {
      // key: "排号-座号", value: [座位ID列表]
      const seatKeyMap = new Map<string, string[]>()

      for (const seat of floorSeats) {
        const key = `${seat.rowLabel}-${seat.seatLabel}`
        if (!seatKeyMap.has(key)) {
          seatKeyMap.set(key, [])
        }
        seatKeyMap.get(key)!.push(seat.id)
      }

      // 找出重复的座位
      for (const [key, seatIds] of seatKeyMap.entries()) {
        if (seatIds.length > 1) {
          const [rowLabel, seatLabel] = key.split('-')
          const floor = data.floors.find((f) => f.id === floorId)
          const floorName = floor?.name || floorId

          errors.push({
            type: 'duplicate_seat',
            message: `${floorName} 存在重复座位：第${rowLabel}排第${seatLabel}座`,
            meta: {
              floorId,
              floorName,
              rowLabel,
              seatLabel,
              duplicateIds: seatIds,
            },
          })
        }
      }
    }
  }

  return {
    success: errors.length === 0,
    errors,
  }
}

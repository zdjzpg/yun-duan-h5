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

  // ========== 演出级状态（show 模式专用，可选） ==========
  /** 是否已售（演出级状态） */
  isSold?: boolean
  /** 已售座位详情（仅当 isSold 为 true 时有效） */
  soldInfo?: {
    orderNo: string
    soldAt: string
    buyerInfo?: string
  }
  /** 演出级临时禁用（针对某场演出禁用，如 VIP 预留等） */
  isShowDisabled?: boolean
  /** 演出级禁用原因（仅当 isShowDisabled 为 true 时有效） */
  showDisabledReason?: 'vip_reserved' | 'equipment' | 'staged_release' | 'maintenance' | 'other'

  // ========== 编辑器属性 ==========
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

/**
 * 票档配置（演出级）
 *
 * - 结构与 a 项目保持一致，便于 1:1 迁移
 * - 座位通过 priceTierId 关联到对应票档
 */
export type PriceTier = {
  /** 票档 ID */
  id: string
  /** 所属演出 ID */
  showId: string
  /** 所属楼层 ID（用于按楼层分组票档，可选） */
  floorId?: string
  /** 关联的座区 ID（用于追溯继承关系，可选） */
  zoneId?: string
  /** 票档名称（例如：VIP、A档、B档） */
  name: string
  /** 票价（单位：元） */
  price: number
  /** 票档颜色（用于座位渲染） */
  color: string
  /** 备注（可选） */
  remark?: string
  /** 显示顺序（用于列表排序） */
  order: number
}

export type TheaterData = {
  id: string
  name: string

  /** 所属场馆 ID（用于演出模式与场馆数据关联，可选） */
  venueId?: string

  floors: Floor[]
  seats: Seat[]
  /** 场馆级单例舞台（所有楼层共享） */
  stage?: Stage
  /** 场馆级座区配置列表 */
  zones?: Zone[]
  /** 演出级票档配置列表（show 模式使用，可选） */
  priceTiers?: PriceTier[]
  /** 视口状态（用于保存用户视角位置与缩放比例） */
  viewport?: {
    offsetX: number
    offsetY: number
    scale: number
  }
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

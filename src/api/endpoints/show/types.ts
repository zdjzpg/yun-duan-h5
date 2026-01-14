/**
 * 演出管理模块 - 类型定义 --暂时用不到
 *
 * 仅包含票档与座位-票档映射等演出级配置的数据结构。
 *
 * @module api/endpoints/show/types
 */

/**
 * 票档（价格档位）
 */
export type PriceTier = {
  /** 票档 ID */
  id: string
  /** 所属演出 ID */
  showId: string
  /** 票档名称，例如：'VIP'、'A档'、'B档' */
  name: string
  /** 票价（单位：分） */
  price: number
  /** 票档颜色（用于座位图渲染） */
  color: string
  /** 备注（可选） */
  remark?: string
  /** 显示顺序（用于列表排序） */
  order: number
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt?: string
}

/**
 * 座位-票档映射关系
 */
export type ShowSeatPrice = {
  /** 映射 ID */
  id: string
  /** 演出 ID */
  showId: string
  /** 座位 ID（引用场馆级座位，避免重复） */
  seatId: string
  /** 票档 ID */
  priceTierId: string
  /** 创建时间 */
  createdAt: string
}

// ==================== API 请求 / 响应类型 ====================

/**
 * 创建票档 - 请求
 */
export type CreatePriceTierRequest = {
  showId: string
  name: string
  price: number
  color: string
  remark?: string
  order?: number
}

/**
 * 创建票档 - 响应
 */
export type CreatePriceTierResponse = {
  id: string
  showId: string
  name: string
  price: number
  color: string
  order: number
  createdAt: string
}

/**
 * 更新票档 - 请求
 */
export type UpdatePriceTierRequest = {
  name?: string
  price?: number
  color?: string
  remark?: string
  order?: number
}

/**
 * 更新票档 - 响应
 */
export type UpdatePriceTierResponse = PriceTier

/**
 * 删除票档 - 响应
 */
export type DeletePriceTierResponse = {
  success: boolean
  deletedId: string
}

/**
 * 获取票档列表 - 响应
 */
export type GetPriceTierListResponse = {
  list: PriceTier[]
  total: number
}

/**
 * 批量分配座位到票档 - 请求
 */
export type BatchAssignSeatsToPriceTierRequest = {
  showId: string
  priceTierId: string
  seatIds: string[]
}

/**
 * 批量分配座位到票档 - 响应
 */
export type BatchAssignSeatsToPriceTierResponse = {
  created: number
  priceTierId: string
  showId: string
}

/**
 * 按票区分配座位到票档 - 请求
 */
export type AssignSeatsByZoneRequest = {
  showId: string
  priceTierId: string
  zoneId: string
}

/**
 * 按票区分配座位到票档 - 响应
 */
export type AssignSeatsByZoneResponse = {
  created: number
  zoneId: string
  zoneName: string
  priceTierId: string
}

/**
 * 获取座位-票档映射 - 响应
 */
export type GetSeatPriceMappingResponse = {
  list: ShowSeatPrice[]
  total: number
}

/**
 * 票档统计信息
 */
export type PriceTierStats = {
  priceTierId: string
  priceTierName: string
  assignedCount: number
  totalRevenue: number
}

/**
 * 获取演出座位分配统计 - 响应
 */
export type GetShowSeatStatsResponse = {
  totalSeats: number
  assignedSeats: number
  unassignedSeats: number
  priceTiers: PriceTierStats[]
}

/**
 * 更新演出级座位状态（临时禁用/恢复）- 请求
 */
export type UpdateShowSeatStatusRequest = {
  showId: string
  seatIds: string[]
  isDisabled: boolean
  reason?: 'vip_reserved' | 'equipment' | 'staged_release' | 'maintenance' | 'other'
}

/**
 * 更新演出级座位状态 - 响应
 */
export type UpdateShowSeatStatusResponse = {
  success: boolean
  affectedCount: number
}

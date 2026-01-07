/**
 * 精确座位编辑器简化类型
 */

import type { VenueSeatStatus, SeatLabel, SeatDisabledReason } from '@/types/theater'
import type { PriceTier as ApiPriceTier } from '@/api/endpoints/show/types'

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
  /**
   * ä»…ç”¨äºŽæ¼”å‡ºçº§åº§ä½é…ç½®ï¼šæ˜¯å¦å·²å”®å‡º
   */
  isSold?: boolean
  /**
   * ä»…ç”¨äºŽæ¼”å‡ºçº§åº§ä½é…ç½®ï¼šæ¼”å‡ºçº§ç¦ç”¨æ ‡è®?
   */
  isShowDisabled?: boolean
}

/**
 * åº§ä½å›¾ç¼–è¾‘å™¨ä¸­ä½¿ç”¨çš„ç®€åŒ–ç‰ˆç¥¨æ¡£ç±»åž‹ï¼ŒåŸºäºŽåŽç«¯ PriceTier æ•°æ®ã€‚
 */
export type PriceTier = Pick<ApiPriceTier, 'id' | 'showId' | 'name' | 'price' | 'color' | 'remark'> & {
  /** ç»‘å®šçš„å±‚çš„ IDï¼Œå¯é€‰ */
  floorId?: string
  /** ç»‘å®šçš„åŒºåŸŸ IDï¼Œå¯é€‰ */
  zoneId?: string
  /** æ˜¾ç¤ºé¡ºåº? */
  order?: number
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
  /** å¯¹åº”çš„åœºé¦† IDï¼Œå¯é€‰ */
  venueId?: string
  floors: Floor[]
  seats: Seat[]
  stage?: Stage
  zones?: Zone[]
  /** åœ¨æ¼”å‡ºçŽ¯å¢ƒä¸­ï¼Œç”¨äºŽåº§ä½ç®€åŒ–å¼¥æ•£çš„ç¥¨æ¡£é…ç½® */
  priceTiers?: PriceTier[]
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

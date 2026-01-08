import type {
  ShowType,
  ShowStatus,
  SuitableAudience,
  VenueCapacityType,
} from '@/api/endpoints/theater/types'

export type ShowFormBasicInfo = {
  name: string
  venueId: string
  type: ShowType
  suitableAudience?: SuitableAudience[]
  coverImage?: string[]
  subtitle?: string
  description?: string
  producer?: string
  status: ShowStatus
}

export type ShowFormDetails = {
  intro?: string
  bookingRule?: string
  refundRule?: string
  safetyNotice?: string
  detailImages?: string[]
}

export type ShowFormPriceTier = {
  name: string
  price: number
  zoneIds?: string[]
  color?: string
  remark?: string
}

/**
 * 场次级票档配置
 *
 * - 在“场次配置（sessionConfigs）”架构下，票档挂在场次配置上，而不是直接挂在演出上
 * - 当前 B 端项目仍然沿用演出级 priceTiers 字段，SessionPriceTier 与 ShowFormPriceTier 保持相同结构，后续可按需扩展
 */
export type SessionPriceTier = ShowFormPriceTier & {
  id?: string
  floorId?: string
  floorName?: string
  zoneId?: string
  capacity?: number
  order?: number
}

export type ShowFormSalesRule = {
  // 下单规则
  storeIds?: number[]
  orderChannels?: (
    | 'online_mini_program'
    | 'online_sub_mini_program'
    | 'offline_window'
    | 'offline_distribute_window'
    | 'offline_self_service'
  )[]
  realNameType?: 'none' | 'one_buyer' | 'all_visitors'
  needRiskNotice?: boolean
  // 风险提示
  riskNoticeMode?: 'text' | 'file'
  riskNoticeText?: string
  riskNoticeFileName?: string
  enableGroupTicket?: boolean
  // 年龄限制（仅所有游客实名时生效）
  ageLimitType?: 'unlimited' | 'limited'
  groupMinOrderLimitType?: 'unlimited' | 'at_least'
  groupMinOrderQuantity?: number
  paymentLimitType?: 'minutes_after_order' | 'unlimited'
  paymentLimitMinutesAfterOrder?: number
  purchaseLimitType?: 'per_identity' | 'unlimited'
  purchaseLimitPerIdentity?: number
  saleEndRuleType?: 'before' | 'after'
  saleEndBeforeMinutes?: number
  saleEndAfterMinutes?: number

  // 取票 / 验票规则
  pickupTimeType?: 'no_pickup' | 'same_day'
  printMode?: 'one_per_person' | 'one_per_type'
  autoPrint?: boolean
  printTemplate?: string
  printCopyType?: 'real_price' | 'custom'
  printCustomPrice?: number
  verifyMethods?: Array<'order_qr' | 'ticket_qr' | 'paper' | 'id_card' | 'face'>
  verifyTimeType?: 'same_day' | 'custom'
  verifyTimeBeforeHours?: number
  verifyTimeBeforeMinutes?: number
  verifyTimeAfterHours?: number
  verifyTimeAfterMinutes?: number

  // 退改规则
  refundRuleType?: 'not_refundable' | 'conditional' | 'anytime'
  refundDeadlineMinutesBeforeShow?: number
  refundFeeType?: 'no_fee' | 'need_fee'
  refundFeeRuleType?: 'fixed' | 'ladder'
  refundFeeFixedAmount?: number
  refundFeeFixedUnit?: 'yuan' | 'percent'
  refundFeeLadderRules?: Array<{
    id?: string
    offsetDirection?: 'before' | 'after'
    offsetDays?: number
    offsetTime?: string
    feeRate?: number
    feeUnit?: 'yuan' | 'percent'
  }>
  refundReviewType?: 'auto' | 'manual'
}

export type ShowFormSession = {
  date?: string
  startTime?: string
  durationMinutes: number
  openTime?: string
}

/**
 * 场次配置（SessionConfig）
 *
 * - 对应 A 端项目中的 sessionConfigs 架构：一个配置 = 1 个场馆 + 多个场次时间 + 统一票档
 * - 当前 B 端项目仍然只使用单场馆单配置，但数据结构已对齐，便于后续扩展
 */
export type SessionConfig = {
  venueId: string
  venueName?: string
  venueCapacityType?: VenueCapacityType
  priceTiers: SessionPriceTier[]
  seatPriceTierMapping?: Record<string, string>
  seatDisabledStates?: Record<
    string,
    {
      disabled: boolean
      reason?: 'vip_reserved' | 'equipment' | 'staged_release' | 'maintenance' | 'other'
    }
  >
  sessions: ShowFormSession[]
}

export type ShowFormData = {
  basicInfo: ShowFormBasicInfo
  sessions: ShowFormSession[]
  priceTiers: ShowFormPriceTier[]
  seatPriceTierMapping?: Record<string, string>
  sessionConfigs?: SessionConfig[]
  salesRule: ShowFormSalesRule
  details: ShowFormDetails
}

export const FORM_STEPS = [
  { key: 'basicInfo', title: '基础信息' },
  { key: 'sessions', title: '场次配置' },
  { key: 'salesRule', title: '预订规则' },
  { key: 'details', title: '演出详情' },
] as const

export type FormStepKey = (typeof FORM_STEPS)[number]['key']

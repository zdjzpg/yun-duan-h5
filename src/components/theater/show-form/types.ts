import type {
  ShowType,
  ShowStatus,
  SuitableAudience,
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

export type ShowFormSession = {
  date?: string
  startTime?: string
  durationMinutes: number
  openTime?: string
}

export type ShowFormPriceTier = {
  name: string
  price: number
  zoneIds?: string[]
  color?: string
  remark?: string
}

export type ShowFormSalesRule = {
  saleStartType: 'immediate' | 'scheduled'
  saleStartTime?: string
  saleEndType: 'before_show' | 'scheduled'
  saleEndMinutesBeforeShow?: number
  saleEndTime?: string
  allowRefund: boolean
  refundDeadlineType?: 'before_show' | 'scheduled'
  refundDeadlineHoursBeforeShow?: number
  refundDeadlineTime?: string
  maxPurchasePerOrder: number
}

export type ShowFormData = {
  basicInfo: ShowFormBasicInfo
  sessions: ShowFormSession[]
  priceTiers: ShowFormPriceTier[]
  seatPriceTierMapping?: Record<string, string>
  salesRule: ShowFormSalesRule
}

export const FORM_STEPS = [
  { key: 'basicInfo', title: '基础信息', description: '填写演出基本信息' },
  { key: 'sessions', title: '场次配置', description: '添加演出场次' },
  { key: 'priceTiers', title: '票档价格', description: '配置票档和价格' },
  { key: 'salesRule', title: '销售规则', description: '设置销售和退票规则' },
] as const

export type FormStepKey = (typeof FORM_STEPS)[number]['key']


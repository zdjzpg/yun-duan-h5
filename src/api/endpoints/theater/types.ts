/**
 * 剧场业务 API 类型定义
 *
 * @module api/endpoints/theater/types
 */

import type {
  Venue,
  VenueZone,
  VenueSeat,
  VenueCapacityType,
  VenueType,
  VenueStatus,
  Show,
  ShowSession,
  ShowPriceTier,
  ShowSalesRule,
  ShowType,
  ShowStatus,
  VenueSeatStatus, // 使用新类型
  SeatLabel,
} from '../../../types/theater'

// ==================== 场馆管理 API ====================

/**
 * 场馆列表请求参数
 */
export type VenueListRequest = {
  /** 页码 */
  page?: number

  /** 每页数量 */
  pageSize?: number

  /** 搜索关键词（场馆名称） */
  keyword?: string

  /** 状态筛选 */
  status?: VenueStatus
}

/**
 * 场馆列表响应
 */
export type VenueListResponse = {
  /** 场馆列表 */
  list: Venue[]

  /** 总数 */
  total: number

  /** 当前页码 */
  page: number

  /** 每页数量 */
  pageSize: number
}

/**
 * 创建场馆请求 - 基础信息
 */
export type CreateVenueBaseRequest = {
  /** 场馆名称 */
  name: string

  /** 场馆类型 */
  type?: VenueType

  /** 所属景区 ID */
  scenicId?: string

  /** 场馆地址 */
  address?: string

  /** 场馆简介 */
  description?: string

  /** 容量类型 */
  capacityType: VenueCapacityType
}

/**
 * 创建场馆请求 - 自由站席模式
 */
export type CreateVenueFreeSeatRequest = CreateVenueBaseRequest & {
  capacityType: 'free_seating'

  /** 总容量 */
  totalCapacity: number
}

/**
 * 创建场馆请求 - 按座区数量模式
 */
export type CreateVenueZoneCapacityRequest = CreateVenueBaseRequest & {
  capacityType: 'zone_capacity'

  /** 座区列表 */
  zones: Array<{
    /** 座区名称 */
    name: string

    /** 座区容量 */
    capacity: number

    /** 排序 */
    sort?: number
  }>
}

/**
 * 创建场馆请求 - 精确座位模式
 */
export type CreateVenuePreciseSeatRequest = CreateVenueBaseRequest & {
  capacityType: 'precise_seat'

  /** 座区列表 */
  zones: Array<{
    /** 座区名称 */
    name: string

    /** 座区简称 */
    shortName?: string

    /** 座区颜色 */
    color?: string

    /** 楼层 */
    floor?: string

    /** 排数 */
    rows?: number

    /** 每排座位数 */
    seatsPerRow?: number
  }>

  /** 座位列表 */
  seats: Array<{
    /** 座区 ID（临时 ID，用于关联） */
    zoneId: string

    /** 排号 */
    rowLabel: string

    /** 座号 */
    seatLabel: string

    /** 座位状态 */
    status: VenueSeatStatus // 使用新类型

    /** 座位标签 */
    label?: SeatLabel

    /** X 坐标 */
    x: number

    /** Y 坐标 */
    y: number
  }>
}

/**
 * 创建场馆请求（联合类型）
 */
export type CreateVenueRequest =
  | CreateVenueFreeSeatRequest
  | CreateVenueZoneCapacityRequest
  | CreateVenuePreciseSeatRequest

/**
 * 创建场馆响应
 */
export type CreateVenueResponse = {
  /** 场馆 ID */
  id: string
}

/**
 * 更新场馆请求
 */
export type UpdateVenueRequest = Partial<CreateVenueRequest> & {
  /** 场馆 ID */
  id: string
}

/**
 * 场馆详情响应
 */
export type VenueDetailResponse = Venue

/**
 * 更新场馆状态 ====================
 */
export type UpdateVenueStatusRequest = {
  id: string
  status: VenueStatus
}

/**
 * 删除场馆 ====================
 */
export type DeleteVenueRequest = {
  id: string
}

/**
 * 删除场馆响应
 */
export type DeleteVenueResponse = {
  success: boolean
}

// ==================== 场馆锁定检测 ====================

/**
 * 场馆锁定状态
 */
export type VenueLockStatus = {
  /** 场馆 ID */
  venueId: string

  /** 是否被锁定（有订单） */
  isLocked: boolean

  /** 锁定原因 */
  lockReason?: 'has_orders' | 'referenced_by_show'

  /** 引用该场馆的演出数量 */
  referencedShowCount: number

  /** 总订单数 */
  totalOrders: number

  /** 最后更新时间 */
  lastCheckedAt: string
}

/**
 * 检查场馆锁定状态请求
 */
export type CheckVenueLockStatusRequest = {
  /** 场馆 ID */
  venueId: string
}

/**
 * 检查场馆锁定状态响应
 */
export type CheckVenueLockStatusResponse = VenueLockStatus

/**
 * 复制场馆请求
 */
export type CopyVenueRequest = {
  /** 源场馆 ID */
  sourceVenueId: string

  /** 新场馆名称 */
  newVenueName?: string

  /** 是否复制座位数据（仅精确座位模式） */
  copySeatData?: boolean
}

/**
 * 复制场馆响应
 */
export type CopyVenueResponse = {
  /** 新场馆 ID */
  newVenueId: string

  /** 新场馆对象 */
  venue: Venue
}

// ==================== 演出管理 API ====================

/**
 * 演出列表响应
 */
export type ShowListResponse = {
  /** 演出列表 */
  list: Show[]

  /** 总数 */
  total: number

  /** 当前页码 */
  page: number

  /** 每页数量 */
  pageSize: number
}

/**
 * 演出列表请求（Ticketing DTO）
 */
export interface ShowListRequestDto {
  /** 页码 */
  Page: number | null
  /** 每页数量 */
  PageSize: number | null
  /** 搜索关键字(演出名称) */
  Keyword: string
  /** 所属场馆Uid，null为不限制场馆 */
  VenueUid: number | null
  /** 发布状态，1:在售，2:草稿，3:停售，4:已结束 */
  ShowStatus: number
}

// export interface ShowSummaryDto { }

/**
 * 演出详情 DTO（Ticketing）
 */
export interface ShowDto {
  /** 演出uid，创建新演出时赋0 */
  Uid: number
  /** 所属场馆uid */
  VenueUid: number
  /** 演出名称 */
  ShowName: string
  /** 演出类型，1:实景演出，2:音乐剧，3:话剧，4:演唱会，5:其它 */
  ShowType: number
  /** 封面图URL数组，第一张默认设置为封面 */
  CoverImages: string[]
  /** 演出简介 */
  Description: string
  /** 演出详情-演出介绍文本 */
  DetailsIncludeRule: string
  /** 演出详情-预订规则文本 */
  DetailsBookingRule: string
  /** 演出详情-退改规则文本 */
  DetailsRefundRule: string
  /** 演出详情-安全须知文本 */
  DetailsSafetyNotice: string
  /** 演出详情-详情图片URL列表 */
  DetailImages: string[]
  /** 发布状态，1:上架，2:放入仓库，3:下架，4:定时上下架 */
  ShowStatus: number
  /** 自动上架，1:立即上架，3:第一场次开始自动上架，4:指定时间上架 */
  OnlineTimeType: number | null
  /** 指定自动上架时间 */
  OnlineTime: string | null
  /** 自动下架，3:最后一场结束自动下架，4:指定下架时间 */
  OfflineTimeType: number | null
  /** 指定时间自动下架 */
  OfflineTime: string | null
  /** 可销售门店/用户 */
  AssignUsersForSale: number[]
  /** 销售渠道，0:线下票务窗口，1:线上小程序 */
  OrderChannels: number[]
  /** 是否需要风险提示，0:否，1:是 */
  NeedRiskNotice: number
  /** 风险提示内容类型，0:文本，1:文件 */
  RiskNoticeMode: number
  /** 风险提示文本内容 */
  RiskNoticeText: string
  /** 风险提示上传文档路径 */
  RiskNoticeFileName: string
  /** 是否团体票，0:否，1:是 */
  EnableGroupTicket: number
  /** 团体票最小起订量(张)，null为不限制 */
  GroupTicketMinQuantity: number | null
  /** 下单x分钟未付款自动取消订单，null不限制 */
  TimeLengthForAutoCancel: number | null
  /** 每个手机号/身份证最多购买x张，null不限 */
  MaxQuantityForPerIdentity: number | null
  /** 停止销售时间设置 */
  TimeLengthForStopSale: number
  /** 可核销门店/用户 */
  AssignUsersForVerify: number[]
  /**
   * 核销门店下验票站点和验票次数配置
   * - StoreId 对应 AssignUsersForVerify 中的用户/门店 ID
   * - Enabled: 0 = 不可用，1 = 可用
   * - VerifyLimit: null 表示无限，>0 表示限制验票次数
   */
  VerifyStoreStations?: Array<{
    StoreId: number
    StoreName?: string
    Stations: Array<{
      StationId: string
      StationName: string
      Enabled: number
      VerifyLimit: number | null
    }>
  }>
  /** 场馆容量模式：0: 自由站席，1: 按座区容量配置，2: 精确座位模式 */
  VenueCapacityType: number
  /** 取票时机，0:无需取票，1:当天可取 */
  PickupTimeType: number
  /** 门票打印方式，0:一人一票，2:一种票一张 */
  PrintMode: number
  /** 销售开单打印时机，0:自动打印，1:手动打印 */
  PrintTiming: number
  /** 打印模版Uid，默认填0 */
  PrintTemplateUid: number
  /** 打印票价方式，0:真实票价，1:自定义 */
  PrintPriceType: number
  /** 自定义打印票价 */
  CustomPrintPrice: number | null
  /** 验票方式，1:订单二维码，2:纸质门票(票根)，3:票二维码 */
  CheckingWay: number[]
  /** 验票时间限制，0:不限，1:自定义 */
  VerifyTimeType: number
  /** 验票时限：不超过开演时间前X小时 */
  VerifyTimeBeforeHours: number | null
  /** 验票时限：不超过开演时间前X分钟 */
  VerifyTimeBeforeMinutes: number | null
  /** 验票时限：不超过开演时间后X小时 */
  VerifyTimeAfterHours: number | null
  /** 验票时限：不超过开演时间后X分钟 */
  VerifyTimeAfterMinutes: number | null
  /** 退票规则，0:不可退，1:有条件退，2:随时退 */
  RefundRuleType: number
  /** 退票截止时间，演出开演前X分钟 */
  RefundDeadlineMinutesBeforeShow: number | null
  /** 退票是否需要手续费，0:否，1:是 */
  NeedRefundFee: number
  /** 退票手续费模式，0:固定手续费，1:阶梯金额 */
  RefundFeeMode: number | null
  /** 固定手续费类型，0:金额，1:百分比 */
  RefundFeeFixedUnit: number | null
  /** 固定手续费值 */
  RefundFeeFixedValue: number | null
  /** 退票阶梯规则列表 */
  RefundFeeLadderRules: RefundFeeLadderRuleDto[]
  /** 退票审核，0:自动原路退款，1:审核后退款 */
  RefundAuditMode: number
  /** 过期操作，0:不处理，1:过期自动退 */
  OverdueOperationType: number | null
  /** 演出场次 */
  Sessions: ShowSessionDto[]
}

export interface ShowSessionDto {
  /** 演出日期 */
  Date: string
  /** 开演时间 */
  StartTime: string
  /** 演出时长（分钟） */
  DurationMinutes: number
  /** 票档信息 */
  PriceTiers: ShowPriceTierDto[]
}

export interface ShowPriceTierDto {
  /** 票档名称 */
  PriceTierName: string
  /** 票面价 */
  Price: number
  /** 关联座区 ID 列表 */
  VenueZoneUid: number
  /** 库存数量 */
  Stock: number
}

export interface RefundFeeLadderRuleDto {
  /** 截止检票时间前后，0:前，1:后 */
  OffsetDirection: number
  /** 截止检票时间前后天数 */
  OffsetDays: number
  /** 截止检票时间前后X天的时间点，例如12:00 */
  OffsetTime: string
  /** 固定手续费类型，0:金额，1:百分比 */
  FeeUnit: number
  /** 固定手续费值 */
  FeeValue: number
}

export type {
  Venue,
  VenueZone,
  VenueSeat,
  VenueCapacityType,
  VenueType,
  VenueStatus,
  Show,
  ShowSession,
  ShowPriceTier,
  ShowSalesRule,
  ShowType,
  ShowStatus,
  VenueSeatStatus, // 使用新类型
  SeatLabel,
}

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
  SuitableAudience,
  VenueSeatStatus,  // 使用新类型
  SeatLabel,
} from '../../../types/theater';

// ==================== 场馆管理 API ====================

/**
 * 场馆列表请求参数
 */
export type VenueListRequest = {
  /** 页码 */
  page?: number;
  
  /** 每页数量 */
  pageSize?: number;
  
  /** 搜索关键词（场馆名称） */
  keyword?: string;
  
  /** 状态筛选 */
  status?: VenueStatus;
};

/**
 * 场馆列表响应
 */
export type VenueListResponse = {
  /** 场馆列表 */
  list: Venue[];
  
  /** 总数 */
  total: number;
  
  /** 当前页码 */
  page: number;
  
  /** 每页数量 */
  pageSize: number;
};

/**
 * 创建场馆请求 - 基础信息
 */
export type CreateVenueBaseRequest = {
  /** 场馆名称 */
  name: string;
  
  /** 场馆类型 */
  type?: VenueType;
  
  /** 所属景区 ID */
  scenicId?: string;
  
  /** 场馆地址 */
  address?: string;
  
  /** 场馆简介 */
  description?: string;
  
  /** 容量类型 */
  capacityType: VenueCapacityType;
};

/**
 * 创建场馆请求 - 自由站席模式
 */
export type CreateVenueFreeSeatRequest = CreateVenueBaseRequest & {
  capacityType: 'free_seating';
  
  /** 总容量 */
  totalCapacity: number;
};

/**
 * 创建场馆请求 - 按座区数量模式
 */
export type CreateVenueZoneCapacityRequest = CreateVenueBaseRequest & {
  capacityType: 'zone_capacity';
  
  /** 座区列表 */
  zones: Array<{
    /** 座区名称 */
    name: string;
    
    /** 座区容量 */
    capacity: number;
    
    /** 排序 */
    sort?: number;
  }>;
};

/**
 * 创建场馆请求 - 精确座位模式
 */
export type CreateVenuePreciseSeatRequest = CreateVenueBaseRequest & {
  capacityType: 'precise_seat';
  
  /** 座区列表 */
  zones: Array<{
    /** 座区名称 */
    name: string;
    
    /** 座区简称 */
    shortName?: string;
    
    /** 座区颜色 */
    color?: string;
    
    /** 楼层 */
    floor?: string;
    
    /** 排数 */
    rows?: number;
    
    /** 每排座位数 */
    seatsPerRow?: number;
  }>;
  
  /** 座位列表 */
  seats: Array<{
    /** 座区 ID（临时 ID，用于关联） */
    zoneId: string;
    
    /** 排号 */
    rowLabel: string;
    
    /** 座号 */
    seatLabel: string;
    
    /** 座位状态 */
    status: VenueSeatStatus;  // 使用新类型
    
    /** 座位标签 */
    label?: SeatLabel;
    
    /** X 坐标 */
    x: number;
    
    /** Y 坐标 */
    y: number;
  }>;
};

/**
 * 创建场馆请求（联合类型）
 */
export type CreateVenueRequest = 
  | CreateVenueFreeSeatRequest 
  | CreateVenueZoneCapacityRequest 
  | CreateVenuePreciseSeatRequest;

/**
 * 创建场馆响应
 */
export type CreateVenueResponse = {
  /** 场馆 ID */
  id: string;
};

/**
 * 更新场馆请求
 */
export type UpdateVenueRequest = Partial<CreateVenueRequest> & {
  /** 场馆 ID */
  id: string;
};

/**
 * 场馆详情响应
 */
export type VenueDetailResponse = Venue;

/**
 * 更新场馆状态 ====================
 */
export type UpdateVenueStatusRequest = {
  id: string;
  status: VenueStatus;
};

/**
 * 删除场馆 ====================
 */
export type DeleteVenueRequest = {
  id: string;
};

/**
 * 删除场馆响应
 */
export type DeleteVenueResponse = {
  success: boolean;
};

// ==================== 场馆锁定检测 ====================

/**
 * 场馆锁定状态
 */
export type VenueLockStatus = {
  /** 场馆 ID */
  venueId: string;
  
  /** 是否被锁定（有订单） */
  isLocked: boolean;
  
  /** 锁定原因 */
  lockReason?: 'has_orders' | 'referenced_by_show';
  
  /** 引用该场馆的演出数量 */
  referencedShowCount: number;
  
  /** 总订单数 */
  totalOrders: number;
  
  /** 最后更新时间 */
  lastCheckedAt: string;
};

/**
 * 检查场馆锁定状态请求
 */
export type CheckVenueLockStatusRequest = {
  /** 场馆 ID */
  venueId: string;
};

/**
 * 检查场馆锁定状态响应
 */
export type CheckVenueLockStatusResponse = VenueLockStatus;

/**
 * 复制场馆请求
 */
export type CopyVenueRequest = {
  /** 源场馆 ID */
  sourceVenueId: string;
  
  /** 新场馆名称 */
  newVenueName?: string;
  
  /** 是否复制座位数据（仅精确座位模式） */
  copySeatData?: boolean;
};

/**
 * 复制场馆响应
 */
export type CopyVenueResponse = {
  /** 新场馆 ID */
  newVenueId: string;
  
  /** 新场馆对象 */
  venue: Venue;
};

// ==================== 演出管理 API ====================

/**
 * 演出列表请求参数
 */
export type ShowListRequest = {
  /** 页码 */
  page?: number;
  
  /** 每页数量 */
  pageSize?: number;
  
  /** 搜索关键词（演出名称） */
  keyword?: string;
  
  /** 所属场馆 ID */
  venueId?: string;
  
  /** 状态筛选 */
  status?: ShowStatus;
};

/**
 * 演出列表响应
 */
export type ShowListResponse = {
  /** 演出列表 */
  list: Show[];
  
  /** 总数 */
  total: number;
  
  /** 当前页码 */
  page: number;
  
  /** 每页数量 */
  pageSize: number;
};

/**
 * 创建演出请求
 */
export type CreateShowRequest = {
  /** 演出名称 */
  name: string;
  
  /** 所属场馆 ID */
  venueId: string;
  
  /** 演出类型 */
  type: ShowType;
  
  /** 适合人群 */
  suitableAudience?: SuitableAudience[];
  
  /** 封面图 URL 数组 */
  coverImage?: string[];
  
  /** 副标题 */
  subtitle?: string;
  
  /** 演出简介 */
  description?: string;
  
  /** 主办方 */
  producer?: string;
  
  /** 演出详情 - 演出介绍文本 */
  detailsIntro?: string;
  
  /** 演出详情 - 预订规则文本 */
  detailsBookingRule?: string;
  
  /** 演出详情 - 退改规则文本 */
  detailsRefundRule?: string;
  
  /** 演出详情 - 安全须知文本 */
  detailsSafetyNotice?: string;
  
  /** 演出详情 - 详情图片 URL 列表 */
  detailImages?: string[];
  
  /** 演出状态 */
  status: ShowStatus;
  
  /** 场次列表 */
  sessions?: Array<{
    /** 演出日期 */
    date: string;
    
    /** 开演时间 */
    startTime: string;
    
    /** 演出时长（分钟） */
    durationMinutes: number;
    
    /** 开场时间 */
    openTime?: string;
  }>;
  
  /** 票档列表 */
  priceTiers?: Array<{
    /** 票档名称 */
    name: string;
    
    /** 票面价 */
    price: number;
    
    /** 关联座区 ID 列表 */
    zoneIds?: string[];
    
    /** 颜色标识 */
    color?: string;
    
    /** 备注 */
    remark?: string;
  }>;
  
  /** 销售规则 */
  salesRule?: {
    /** 开售时间类型 */
    saleStartType: 'immediate' | 'scheduled';
    
    /** 开售时间 */
    saleStartTime?: string;
    
    /** 停售时间类型 */
    saleEndType: 'before_show' | 'scheduled';
    
    /** 停售时间 - 开演前 X 分钟 */
    saleEndMinutesBeforeShow?: number;
    
    /** 停售时间 - 指定时间 */
    saleEndTime?: string;
    
    /** 是否允许退票 */
    allowRefund: boolean;
    
    /** 退票截止时间类型 */
    refundDeadlineType?: 'before_show' | 'scheduled';
    
    /** 退票截止时间 - 开演前 X 小时 */
    refundDeadlineHoursBeforeShow?: number;
    
    /** 退票截止时间 - 指定时间 */
    refundDeadlineTime?: string;
    
    /** 单笔订单最多购买数量 */
    maxPurchasePerOrder: number;
  };
};

/**
 * 创建演出响应
 */
export type CreateShowResponse = {
  /** 演出 ID */
  id: string;
};

/**
 * 更新演出请求
 */
export type UpdateShowRequest = Partial<CreateShowRequest> & {
  /** 演出 ID */
  id: string;
};

/**
 * 演出详情响应
 */
export type ShowDetailResponse = {
  /** 演出基础信息 */
  show: Show;

  /** 场次列表 */
  sessions: ShowSession[];

  /** 票档列表 */
  priceTiers: ShowPriceTier[];

  /** 销售规则 */
  salesRule: ShowSalesRule;

  /**
   * 座位-票档映射（座位 ID -> 票档 ID）
   * 原有数据字段，这里补充到类型定义中便于表单编辑使用。
   */
  seatPriceTierMapping?: Record<string, string>;
  sessionConfigs?: any[];
};

/**
 * 更新演出状态请求
 */
export type UpdateShowStatusRequest = {
  /** 演出 ID */
  id: string;
  
  /** 状态 */
  status: ShowStatus;
};

/**
 * 删除演出请求
 */
export type DeleteShowRequest = {
  /** 演出 ID */
  id: string;
};

/**
 * 删除演出响应
 */
export type DeleteShowResponse = {
  /** 是否成功 */
  success: boolean;
};

/**
 * 批量生成场次请求
 */
export type BatchCreateSessionsRequest = {
  /** 演出 ID */
  showId: string;
  
  /** 日期范围 - 开始日期 */
  startDate: string;
  
  /** 日期范围 - 结束日期 */
  endDate: string;
  
  /** 星期选择（0-6，0 表示周日） */
  weekdays: number[];
  
  /** 开演时间 */
  startTime: string;
  
  /** 演出时长（分钟） */
  durationMinutes: number;
  
  /** 开场时间 */
  openTime?: string;
};

/**
 * 批量生成场次响应
 */
export type BatchCreateSessionsResponse = {
  /** 生成的场次数量 */
  count: number;
  
  /** 生成的场次列表 */
  sessions: ShowSession[];
};

// ==================== 导出类型（用于其他模块引用）====================

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
  SuitableAudience,
  VenueSeatStatus,  // 使用新类型
  SeatLabel,
};

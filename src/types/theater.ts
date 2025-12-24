/**
 * 剧场业务相关类型定义
 * 
 * 📚 本文件定义剧场业务中的核心类型：场馆、演出、场次、票档等
 * 可根据实际业务需求扩展字段
 * 
 * @module types/theater
 */

/**
 * 场馆容量类型
 */
export type VenueCapacityType = 
  | 'free_seating'    // 自由站席
  | 'zone_capacity'   // 按座区数量
  | 'precise_seat';   // 精确座位

/**
 * 场馆类型
 */
export type VenueType = 
  | 'indoor_theater'   // 室内剧场
  | 'outdoor_scene'    // 室外实景
  | 'multifunctional'  // 多功能厅
  | 'other';          // 其他

/**
 * 场馆状态
 */
export type VenueStatus = 
  | 'active'    // 启用
  | 'inactive'; // 停用

/**
 * 场馆级座位状态（物理属性，不因演出改变）
 * 
 * 业务逻辑：
 * - 这些状态由场馆物理条件决定
 * - 一次配置，所有演出生效
 * - 禁用座位在所有演出中都不可用
 * 
 * @example
 * - available: 1排1座 - 正常可用座位
 * - disabled: 3排5座 - 禁用座位（设备占用/维护中等原因）
 */
export type VenueSeatStatus = 
  | 'available'  // ✅ 可用（正常座位）
  | 'disabled';  // ❌ 禁用（设备占用、维护中、其他）

/**
 * 座位禁用原因
 */
export type SeatDisabledReason =
  | 'equipment'    // 设备占用（音响、摄像机位）
  | 'maintenance'  // 维护中（椅子损坏、临时维修）
  | 'other';       // 其他原因

/**
 * 座位标签
 */
export type SeatLabel = 
  | 'accessible'  // 无障碍席
  | 'vip';        // 贵宾席

/**
 * 场馆座区信息
 */
export interface VenueZone {
  /** 座区 ID */
  id: string;
  
  /** 所属场馆 ID */
  venueId: string;
  
  /** 座区名称 */
  name: string;
  
  /** 座区简称 */
  shortName?: string;
  
  /** 座区颜色（用于座位图显示） */
  color?: string;
  
  /** 楼层/层级（文本） */
  floor?: string;
  
  /** 楼层 ID（关联到 VenueFloor） */
  floorId?: string;
  
  /** 座区容量（仅 zone_capacity 模式使用） */
  capacity?: number;
  
  /** 排序 */
  sort?: number;
  
  /** 排数（用于批量生成） */
  rows?: number;
  
  /** 每排座位数（用于批量生成） */
  seatsPerRow?: number;
  
  /** 创建时间 */
  createdAt: string;
  
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 场馆座位信息（仅 precise_seat 模式使用）
 */
export interface VenueSeat {
  /** 座位 ID */
  id: string;
  
  /** 所属场馆 ID */
  venueId: string;
  
  /** 所属楼层 ID */
  floorId: string;
  
  /** 所属座区 ID */
  zoneId: string;
  
  /** 排号标识 */
  rowLabel: string;
  
  /** 座号标识 */
  seatLabel: string;
  
  /** 座位状态 */
  status: VenueSeatStatus;
  
  /** 禁用原因（仅当 status 为 'disabled' 时有效） */
  disabledReason?: SeatDisabledReason;
  
  /** 座位标签 */
  label?: SeatLabel;
  
  /** 座位图 X 坐标 */
  x: number;
  
  /** 座位图 Y 坐标 */
  y: number;
  
  /** 创建时间 */
  createdAt: string;
  
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 场馆楼层信息（仅 precise_seat 模式使用）
 */
export interface VenueFloor {
  /** 楼层 ID */
  id: string;
  
  /** 楼层名称 */
  name: string;
  
  /** 排序顺序 */
  order: number;
}

/**
 * 舞台配置（座位图编辑器使用）
 */
export interface VenueStageConfig {
  /** 舞台 ID */
  id: string;
  
  /** 舞台名称 */
  name: string;
  
  /** 舞台中心 X 坐标 */
  x: number;
  
  /** 舞台中心 Y 坐标 */
  y: number;
  
  /** 舞台形状 */
  shape: 'rect' | 'trapezoid' | 'arc';
  
  /** 舞台宽度（像素，默认 480px） */
  width: number;
  
  /** 舞台高度（像素） */
  height: number;
  
  /** 舞台位置 */
  position: 'top-center';
  
  /** 舞台颜色 */
  color?: string;
}

/**
 * 场馆座位图配置（仅 precise_seat 模式使用）
 */
export interface VenueSeatMapConfig {
  /** 画布宽度（像素） */
  canvasWidth: number;
  
  /** 画布高度（像素） */
  canvasHeight: number;
  
  /** 背景图片 URL（可选） */
  backgroundImage?: string;
  
  /** 舞台配置 */
  stage?: VenueStageConfig;
}

/**
 * 场馆信息
 */
export interface Venue {
  /** 场馆 ID */
  id: string;
  
  /** 所属商户 ID */
  merchantId: string;
  
  /** 所属景区 ID（可选） */
  scenicId?: string;
  
  /** 场馆名称 */
  name: string;
  
  /** 场馆类型 */
  type?: VenueType;
  
  /** 场馆地址 */
  address?: string;
  
  /** 场馆简介 */
  description?: string;
  
  /** 容量类型 */
  capacityType: VenueCapacityType;
  
  /** 总容量 */
  totalCapacity: number;
  
  /** 场馆状态 */
  status: VenueStatus;
  
  /** 座位结构是否锁定（冗余字段，用于列表展示） */
  isLocked?: boolean;
  
  /** 引用的演出数量（冗余字段，用于列表展示） */
  referencedShowCount?: number;
  
  /** 座区列表（zone_capacity 和 precise_seat 模式使用） */
  zones?: VenueZone[];
  
  /** 座位列表（仅 precise_seat 模式使用） */
  seats?: VenueSeat[];
  
  /** 楼层列表（仅 precise_seat 模式使用） */
  floors?: VenueFloor[];
  
  /** 座位图配置（仅 precise_seat 模式使用） */
  seatMapConfig?: VenueSeatMapConfig;
  
  /** 创建时间 */
  createdAt: string;
  
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 场馆锁定状态
 */
export interface VenueLockStatus {
  /** 场馆 ID */
  venueId: string;
  
  /** 是否已锁定 */
  isLocked: boolean;
  
  /** 锁定原因 */
  lockReason?: 'has_orders' | 'has_referenced_shows';
  
  /** 被引用的演出数量 */
  referencedShowCount: number;
  
  /** 关联的订单总数 */
  totalOrders: number;
  
  /** 检查时间 */
  lastCheckedAt: string;
}

/**
 * 演出类型
 */
export type ShowType = 
  | 'live_show'  // 实景演出
  | 'musical'    // 音乐剧
  | 'drama'      // 话剧
  | 'concert'    // 演唱会
  | 'other';     // 其他

/**
 * 适合人群
 */
export type SuitableAudience = 
  | 'children'      // 儿童
  | 'teenager'      // 青少年
  | 'adult'         // 成人
  | 'elderly'       // 老年人
  | 'all_ages';     // 全年龄

/**
 * 演出状态
 */
export type ShowStatus = 
  | 'draft'       // 草稿
  | 'on_sale'     // 在售
  | 'off_sale'    // 停售
  | 'finished';   // 已结束

/**
 * 演出信息
 */
export interface Show {
  /** 演出 ID */
  id: string;
  
  /** 所属商户 ID */
  merchantId: string;
  
  /** 所属景区 ID（可选） */
  scenicId?: string;
  
  /** 所属场馆 ID */
  venueId: string;
  
  /** 场馆名称（冗余字段，便于列表展示） */
  venueName?: string;
  
  /** 场馆容量类型（冗余字段，用于判断功能入口） */
  venueCapacityType?: VenueCapacityType;
  
  /** 演出名称 */
  name: string;
  
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
  
  /** 演出状态 */
  status: ShowStatus;
  
  /** 场次数量（冗余字段） */
  sessionCount?: number;
  
  /** 最近开演时间（冗余字段） */
  nextSessionTime?: string;
  
  /** 创建时间 */
  createdAt: string;
  
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 演出场次信息
 */
export interface ShowSession {
  /** 场次 ID */
  id: string;
  
  /** 所属演出 ID */
  showId: string;
  
  /** 所属场馆 ID */
  venueId: string;
  
  /** 演出日期 */
  date: string;
  
  /** 开演时间 */
  startTime: string;
  
  /** 出时长（分钟） */
  durationMinutes: number;
  
  /** 开场时间（观众入场时间） */
  openTime?: string;
  
  /** 场次状态 */
  status?: string;
  
  /** 创建时间 */
  createdAt: string;
  
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 演出票档信息
 */
export interface ShowPriceTier {
  /** 票档 ID */
  id: string;
  
  /** 所属演出 ID */
  showId: string;
  
  /** 票档名称 */
  name: string;
  
  /** 票面价（元） */
  price: number;
  
  /** 关联座区 ID 列表（zone_capacity 和 precise_seat 模式使用） */
  zoneIds?: string[];
  
  /** 颜色标识 */
  color?: string;
  
  /** 备注 */
  remark?: string;
  
  /** 创建时间 */
  createdAt: string;
  
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 演出销售规则
 */
export interface ShowSalesRule {
  /** 演出 ID */
  showId: string;
  
  /** 开售时间类型 */
  saleStartType: 'immediate' | 'scheduled';
  
  /** 开售时间（scheduled 时使用） */
  saleStartTime?: string;
  
  /** 停售时间类型 */
  saleEndType: 'before_show' | 'scheduled';
  
  /** 停售时间 - 开演前 X 分钟（before_show 时使用） */
  saleEndMinutesBeforeShow?: number;
  
  /** 停售时间 - 指定时间（scheduled 时使用） */
  saleEndTime?: string;
  
  /** 是否允许退票 */
  allowRefund: boolean;
  
  /** 退票截止时间类型 */
  refundDeadlineType?: 'before_show' | 'scheduled';
  
  /** 退票截止时间 - 开演前 X 小时（before_show 时使用） */
  refundDeadlineHoursBeforeShow?: number;
  
  /** 退票截止时间 - 指定时间（scheduled 时使用） */
  refundDeadlineTime?: string;
  
  /** 单笔订单最多购买数量 */
  maxPurchasePerOrder: number;
}
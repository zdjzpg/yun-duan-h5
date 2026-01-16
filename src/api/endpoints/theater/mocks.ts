// @ts-nocheck

/**
 * 剧场业务 Mock
 *
 * @module api/endpoints/theater/mocks
 */

import type MockAdapter from 'axios-mock-adapter'
import type {
  VenueListRequest,
  VenueListResponse,
  CreateVenueRequest,
  CreateVenueResponse,
  UpdateVenueRequest,
  VenueDetailResponse,
  UpdateVenueStatusRequest,
  DeleteVenueResponse,
  ShowListResponse,
  ShowListRequestDto,
  ShowDto,
} from './types'
import type { ApiResponse } from '../../shared/types'
import { ApiResponseCode } from '../../shared/response-codes'
import type {
  Venue,
  VenueZone,
  VenueSeat,
  Show,
  ShowSession,
  ShowPriceTier,
  ShowSalesRule,
  VenueLockStatus,
} from '../../../types/theater'
const SAMPLE_TICKETING_SHOW_DETAIL: ShowDto = {
  Uid: 1,
  VenueUid: 1,
  ShowName: '夜游山水实景演出',
  ShowType: 2,
  CoverImages: ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800'],
  Description:
    '1沉浸式山水光影秀，演绎千年文化传奇。大型实景演出，融合山水自然景观与现代科技，讲述当地历史文化故事。',
  DetailsIncludeRule: '1',
  DetailsBookingRule: '2',
  DetailsRefundRule: '3',
  DetailsSafetyNotice: '5',
  DetailImages: [],
  ShowStatus: 4,
  OnlineTimeType: 3,
  OnlineTime: '2026-01-15 00:07:00',
  OfflineTimeType: 3,
  OfflineTime: '2026-01-31 07:00:00',
  AssignUsersForSale: [3122001],
  OrderChannels: [0],
  NeedRiskNotice: 1,
  RiskNoticeMode: 0,
  RiskNoticeText: '123',
  RiskNoticeFileName: '',
  EnableGroupTicket: 1,
  GroupTicketMinQuantity: 3,
  TimeLengthForAutoCancel: 1,
  MaxQuantityForPerIdentity: 2,
  TimeLengthForStopSale: -3,
  AssignUsersForVerify: [3122002, 3122001],
  VerifyStoreStations: [
    {
      StoreId: 3122002,
      Stations: [
        {
          StationId: '3122002-2',
          StationName: '北门入园',
          Enabled: 1,
          VerifyLimit: null,
        },
        {
          StationId: '3122002-3',
          StationName: '南门入园A',
          Enabled: 1,
          VerifyLimit: null,
        },
      ],
    },
    {
      StoreId: 3122001,
      Stations: [
        {
          StationId: '3122001-1',
          StationName: '北门出园',
          Enabled: 1,
          VerifyLimit: 1,
        },
      ],
    },
  ],
  VenueCapacityType: 2,
  PickupTimeType: 1,
  PrintMode: 2,
  PrintTiming: 0,
  PrintTemplateUid: 1002,
  PrintPriceType: 1,
  CustomPrintPrice: 3,
  CheckingWay: [3],
  VerifyTimeType: 1,
  VerifyTimeBeforeHours: 1,
  VerifyTimeBeforeMinutes: 1,
  VerifyTimeAfterHours: 2,
  VerifyTimeAfterMinutes: 2,
  RefundRuleType: 2,
  RefundDeadlineMinutesBeforeShow: null,
  NeedRefundFee: 1,
  RefundFeeMode: 1,
  RefundFeeFixedUnit: null,
  RefundFeeFixedValue: null,
  RefundFeeLadderRules: [
    {
      OffsetDirection: 0,
      OffsetDays: 2,
      OffsetTime: '11:21',
      FeeUnit: 0,
      FeeValue: 3,
    },
    {
      OffsetDirection: 1,
      OffsetDays: 1,
      OffsetTime: '11:21',
      FeeUnit: 1,
      FeeValue: 4,
    },
  ],
  RefundAuditMode: 0,
  OverdueOperationType: 1,
  Sessions: [
    {
      Date: '2025-12-15',
      StartTime: '19:30',
      DurationMinutes: 11,
      PriceTiers: [
        {
          PriceTierName: 'VIP 区',
          Price: 11,
          VenueZoneUid: 1,
          Stock: 97,
        },
        {
          PriceTierName: 'A 区',
          Price: 2,
          VenueZoneUid: 2,
          Stock: 296,
        },
        {
          PriceTierName: 'B 区',
          Price: 3,
          VenueZoneUid: 3,
          Stock: 497,
        },
      ],
    },
    {
      Date: '2025-12-16',
      StartTime: '19:30',
      DurationMinutes: 90,
      PriceTiers: [
        {
          PriceTierName: 'VIP 区',
          Price: 11,
          VenueZoneUid: 1,
          Stock: 97,
        },
        {
          PriceTierName: 'A 区',
          Price: 2,
          VenueZoneUid: 2,
          Stock: 296,
        },
        {
          PriceTierName: 'B 区',
          Price: 3,
          VenueZoneUid: 3,
          Stock: 497,
        },
      ],
    },
    {
      Date: '2025-12-22',
      StartTime: '19:30',
      DurationMinutes: 90,
      PriceTiers: [
        {
          PriceTierName: 'VIP 区',
          Price: 11,
          VenueZoneUid: 1,
          Stock: 97,
        },
        {
          PriceTierName: 'A 区',
          Price: 2,
          VenueZoneUid: 2,
          Stock: 296,
        },
        {
          PriceTierName: 'B 区',
          Price: 3,
          VenueZoneUid: 3,
          Stock: 497,
        },
      ],
    },
    {
      Date: '2025-12-18',
      StartTime: '19:30',
      DurationMinutes: 80,
      PriceTiers: [
        {
          PriceTierName: 'VIP 区',
          Price: 11,
          VenueZoneUid: 1,
          Stock: 97,
        },
        {
          PriceTierName: 'A 区',
          Price: 2,
          VenueZoneUid: 2,
          Stock: 296,
        },
        {
          PriceTierName: 'B 区',
          Price: 3,
          VenueZoneUid: 3,
          Stock: 497,
        },
      ],
    },
  ],
}
const MOCK_PRINT_TEMPLATES = [
  { Uid: 1001, Name: '默认打印模板' },
  { Uid: 1002, Name: '山水实景模板' },
  { Uid: 1003, Name: '演唱会票根模板' },
]
// ==================== Mock 数据 ====================

// Mock 场馆数据
const mockVenues: Venue[] = [
  {
    id: 'venue-001',
    merchantId: 'merchant-001',
    name: '大剧场',
    type: 'indoor_theater',
    address: '景区中心广场东侧',
    description: '可容纳 1200 人的室内剧场，配备先进的灯光音响设备',
    capacityType: 'precise_seat',
    totalCapacity: 1200,
    status: 'active',
    floors: [
      { id: 'F1', name: '一层', order: 1 },
      { id: 'F2', name: '二层', order: 2 },
    ],
    zones: [
      {
        id: 'zone-001',
        venueId: 'venue-001',
        name: 'VIP 区',
        shortName: 'VIP',
        color: '#FFD700',
        floor: '一层',
        floorId: 'F1',
        rows: 5,
        seatsPerRow: 20,
        order: 1, // ✅ 新增：显示顺序
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
      {
        id: 'zone-002',
        venueId: 'venue-001',
        name: 'A 区',
        shortName: 'A',
        color: '#FF6B6B',
        floor: '一层',
        floorId: 'F1',
        rows: 15,
        seatsPerRow: 20,
        order: 2, // ✅ 新增：显示顺序
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
      {
        id: 'zone-003',
        venueId: 'venue-001',
        name: 'B 区',
        shortName: 'B',
        color: '#4ECDC4',
        floor: '二层',
        floorId: 'F2',
        rows: 20,
        seatsPerRow: 25,
        order: 3, // ✅ 新增：显示顺序
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
    ],
    seats: generateSeatsForVenue001(),
    seatMapConfig: {
      canvasWidth: 1200,
      canvasHeight: 800,
      stage: {
        id: 'stage-001',
        name: '舞台方向', // ✅ 统一名称为"舞台方向"
        x: 0,
        y: -300,
        shape: 'trapezoid' as const,
        width: 480,
        height: 40,
        position: 'top-center' as const,
        color: '#dedede', // ✅ 使用品牌色 n4（简约中性）
      },
    },
    createdAt: '2025-01-01',
    updatedAt: '2025-12-10',
  },
  {
    id: 'venue-002',
    merchantId: 'merchant-001',
    name: '水上实景剧场',
    type: 'outdoor_scene',
    address: '景区湖畔',
    description: '依托自然山水打造的大型实景演出场地',
    capacityType: 'zone_capacity',
    totalCapacity: 2000,
    status: 'active',
    zones: [
      {
        id: 'zone-004',
        venueId: 'venue-002',
        name: '内场 A 区',
        capacity: 500,
        sort: 1,
        createdAt: '2025-01-15',
        updatedAt: '2025-01-15',
      },
      {
        id: 'zone-005',
        venueId: 'venue-002',
        name: '看台 B 区',
        capacity: 800,
        sort: 2,
        createdAt: '2025-01-15',
        updatedAt: '2025-01-15',
      },
      {
        id: 'zone-006',
        venueId: 'venue-002',
        name: '看台 C 区',
        capacity: 700,
        sort: 3,
        createdAt: '2025-01-15',
        updatedAt: '2025-01-15',
      },
    ],
    createdAt: '2025-01-15',
    updatedAt: '2025-12-09',
  },
  {
    id: 'venue-003',
    merchantId: 'merchant-001',
    name: '小剧场',
    type: 'indoor_theater',
    address: '景区艺术中心二楼',
    description: '适合小型话剧、音乐会的多功能剧场',
    capacityType: 'free_seating',
    totalCapacity: 300,
    status: 'active',
    createdAt: '2025-02-01',
    updatedAt: '2025-12-08',
  },
  {
    id: 'venue-004',
    merchantId: 'merchant-001',
    name: '户外音乐广场',
    type: 'outdoor_scene',
    address: '景区南门广场',
    capacityType: 'free_seating',
    totalCapacity: 1500,
    status: 'inactive',
    createdAt: '2025-03-01',
    updatedAt: '2025-11-20',
  },
  {
    id: 'venue-005',
    merchantId: 'merchant-001',
    name: '梦幻音乐厅',
    type: 'indoor_theater',
    address: '景区文化艺术中心三楼',
    description: '配备专业音响设备的音乐厅，采用精确座位管理，已有售票订单',
    capacityType: 'precise_seat',
    totalCapacity: 800,
    status: 'active',
    isLocked: true, // ✅ 已锁定状态
    floors: [
      {
        id: 'floor-001',
        name: '一层',
        order: 1,
      },
      {
        id: 'floor-002',
        name: '二层',
        order: 2,
      },
    ],
    zones: [
      {
        id: 'zone-007',
        venueId: 'venue-005',
        name: 'VIP 包厢区',
        shortName: 'VIP',
        color: '#FFD700',
        floor: '二层',
        floorId: 'floor-002',
        rows: 3,
        seatsPerRow: 8,
        createdAt: '2025-03-15',
        updatedAt: '2025-03-15',
      },
      {
        id: 'zone-008',
        venueId: 'venue-005',
        name: '池座区',
        shortName: '池座',
        color: '#FF6B6B',
        floor: '一层',
        floorId: 'floor-001',
        rows: 20,
        seatsPerRow: 30,
        createdAt: '2025-03-15',
        updatedAt: '2025-03-15',
      },
      {
        id: 'zone-009',
        venueId: 'venue-005',
        name: '楼座区',
        shortName: '楼座',
        color: '#4ECDC4',
        floor: '二层',
        floorId: 'floor-002',
        rows: 10,
        seatsPerRow: 20,
        createdAt: '2025-03-15',
        updatedAt: '2025-03-15',
      },
    ],
    seats: generateSeatsForVenue005(),
    seatMapConfig: {
      canvasWidth: 1200,
      canvasHeight: 800,
      stage: {
        id: 'stage-005',
        name: '音乐厅舞台',
        x: 0,
        y: -320,
        shape: 'arc' as const,
        width: 480,
        height: 40,
        position: 'top-center' as const,
        color: '#2C3E50',
      },
    },
    createdAt: '2025-03-15',
    updatedAt: '2025-12-18',
  },
]

/**
 * 生成 venue-001（大剧场）的座位数据
 */
function generateSeatsForVenue001(): VenueSeat[] {
  const seats: VenueSeat[] = []
  const baseTime = '2025-01-01'

  // ✅ 座位配置（与编辑器保持一致）
  const SEAT_SIZE = 30 // 座位大小（与 SEAT_CONFIG.SIZE 一致）
  const HORIZONTAL_SPACING = 40 // 横向间距（30px座位 + 10px间隙）
  const VERTICAL_SPACING = 50 // 纵向间距（30px座位 + 20px间隙）

  // ✅ VIP 区（一层，F1）- 5排 x 20座
  // 起始位置：居中对齐，靠近舞台
  let seatIndex = 0
  const vipStartX = -400 // 居中（20座 * 40px = 800px，向左偏移 400px）
  const vipStartY = -200 // 靠近舞台（舞台在 y=-300）

  for (let row = 1; row <= 5; row++) {
    for (let seat = 1; seat <= 20; seat++) {
      const seatId = `seat-${String(++seatIndex).padStart(4, '0')}`

      // ✅ 真实场景：第3排中间10、11座 - 摄像机位（设备占用）
      const isEquipmentDisabled = row === 3 && (seat === 10 || seat === 11)
      // ✅ 真实场景：第1排最右侧座位 - 安全通道（其他原因）
      const isOtherDisabled = row === 1 && seat === 20

      const isDisabled = isEquipmentDisabled || isOtherDisabled
      const disabledReason = isEquipmentDisabled
        ? 'equipment'
        : isOtherDisabled
          ? 'other'
          : undefined

      seats.push({
        id: seatId,
        venueId: 'venue-001',
        floorId: 'F1',
        zoneId: 'zone-001',
        zoneName: 'VIP 区', // ✅ 冗余字段（用于快速显示）
        zoneColor: '#FFD700', // ✅ 冗余字段（用于渲染）
        rowLabel: String(row),
        seatLabel: String(seat),
        status: isDisabled ? 'disabled' : 'available',
        disabledReason, // ✅ 修正：使用正确的枚举值
        x: vipStartX + (seat - 1) * HORIZONTAL_SPACING,
        y: vipStartY + (row - 1) * VERTICAL_SPACING,
        createdAt: baseTime,
        updatedAt: baseTime,
      })
    }
  }

  // ✅ A 区（一层，F1）- 15排 x 20座
  // 起始位置：在 VIP 区后方
  const aStartX = -400
  const aStartY = vipStartY + 5 * VERTICAL_SPACING + 20 // VIP区后方，留20px间隙

  for (let row = 1; row <= 15; row++) {
    for (let seat = 1; seat <= 20; seat++) {
      const seatId = `seat-${String(++seatIndex).padStart(4, '0')}`

      // ✅ 真实场景：第8排15、16座 - 座椅损坏（维护中）
      const isMaintenanceDisabled = row === 8 && (seat === 15 || seat === 16)
      // ✅ 真实场景：第15排（最后一排）左右两角 - 视野遮挡（其他原因）
      const isCornerDisabled = row === 15 && (seat === 1 || seat === 20)

      const isDisabled = isMaintenanceDisabled || isCornerDisabled
      const disabledReason = isMaintenanceDisabled
        ? 'maintenance'
        : isCornerDisabled
          ? 'other'
          : undefined

      seats.push({
        id: seatId,
        venueId: 'venue-001',
        floorId: 'F1',
        zoneId: 'zone-002',
        zoneName: 'A 区', // ✅ 冗余字段（用于快速显示）
        zoneColor: '#FF6B6B', // ✅ 冗余字段（用于渲染）
        rowLabel: String(row),
        seatLabel: String(seat),
        status: isDisabled ? 'disabled' : 'available',
        disabledReason, // ✅ 修正：使用正确的枚举值
        x: aStartX + (seat - 1) * HORIZONTAL_SPACING,
        y: aStartY + (row - 1) * VERTICAL_SPACING,
        createdAt: baseTime,
        updatedAt: baseTime,
      })
    }
  }

  // ✅ B 区（二层，F2）- 20排 x 25座
  // 起始位置：二层，更宽的区域
  const bStartX = -500 // 25座 * 40px = 1000px，向左偏移 500px
  const bStartY = -200 // 二层，Y坐标与一层类似（不同楼层在编辑器中可以有相同Y坐标）

  for (let row = 1; row <= 20; row++) {
    for (let seat = 1; seat <= 25; seat++) {
      const seatId = `seat-${String(++seatIndex).padStart(4, '0')}`

      // ✅ 真实场景：第10排中间12、13座 - 音响设备位（设备占用）
      const isEquipmentDisabled = row === 10 && (seat === 12 || seat === 13)
      // ✅ 真实场景：第20排（最后一排）第1座 - 消防通道（其他原因）
      const isFireExitDisabled = row === 20 && seat === 1

      const isDisabled = isEquipmentDisabled || isFireExitDisabled
      const disabledReason = isEquipmentDisabled
        ? 'equipment'
        : isFireExitDisabled
          ? 'other'
          : undefined

      seats.push({
        id: seatId,
        venueId: 'venue-001',
        floorId: 'F2',
        zoneId: 'zone-003',
        zoneName: 'B 区', // ✅ 冗余字段（用于快速显示）
        zoneColor: '#4ECDC4', // ✅ 冗余字段（用于渲染）
        rowLabel: String(row),
        seatLabel: String(seat),
        status: isDisabled ? 'disabled' : 'available',
        disabledReason, // ✅ 修正：使用正确的枚举值
        x: bStartX + (seat - 1) * HORIZONTAL_SPACING,
        y: bStartY + (row - 1) * VERTICAL_SPACING,
        createdAt: baseTime,
        updatedAt: baseTime,
      })
    }
  }

  return seats
}

/**
 * 生成 venue-005（梦幻音乐厅）的座位数据
 */
function generateSeatsForVenue005(): VenueSeat[] {
  const seats: VenueSeat[] = []
  const baseTime = '2025-03-15'

  // ✅ 座位配置（与编辑器保持一致）
  const SEAT_SIZE = 30
  const HORIZONTAL_SPACING = 40
  const VERTICAL_SPACING = 50

  // ✅ VIP 包厢区（二层，floor-002）- 3排 x 8座
  // 起始位置：右侧包厢区域
  let seatIndex = 0
  const vipBoxStartX = 300 // 右侧位置
  const vipBoxStartY = -200 // 靠近舞台

  for (let row = 1; row <= 3; row++) {
    for (let seat = 1; seat <= 8; seat++) {
      const seatId = `seat-v5-${String(++seatIndex).padStart(4, '0')}`

      // ✅ 真实场景：第2排第4、5座 - 监控设备位（设备占用）
      const isDisabled = row === 2 && (seat === 4 || seat === 5)

      seats.push({
        id: seatId,
        venueId: 'venue-005',
        floorId: 'floor-002',
        zoneId: 'zone-007',
        zoneName: 'VIP 包厢区', // ✅ 冗余字段（用于快速显示）
        zoneColor: '#FFD700', // ✅ 冗余字段（用于渲染）
        rowLabel: String(row),
        seatLabel: String(seat),
        status: isDisabled ? 'disabled' : 'available',
        disabledReason: isDisabled ? 'equipment' : undefined, // ✅ 修正：使用正确的枚举值
        x: vipBoxStartX + (seat - 1) * HORIZONTAL_SPACING,
        y: vipBoxStartY + (row - 1) * VERTICAL_SPACING,
        createdAt: baseTime,
        updatedAt: baseTime,
      })
    }
  }

  // ✅ 池座区（一层，floor-001）- 20排 x 30座
  // 起始位置：中央区域，居中对齐
  const poolStartX = -600 // 30座 * 40px = 1200px，向左偏移 600px（完全居中）
  const poolStartY = -250 // 最靠近舞台

  for (let row = 1; row <= 20; row++) {
    for (let seat = 1; seat <= 30; seat++) {
      const seatId = `seat-v5-${String(++seatIndex).padStart(4, '0')}`

      // ✅ 真实场景：第10排中间15、16座 - 座椅损坏（维护中）
      const isMaintenanceDisabled = row === 10 && (seat === 15 || seat === 16)
      // ✅ 真实场景：第1排第1、30座 - 安全通道（其他原因）
      const isCornerDisabled = row === 1 && (seat === 1 || seat === 30)

      const isDisabled = isMaintenanceDisabled || isCornerDisabled
      const disabledReason = isMaintenanceDisabled
        ? 'maintenance'
        : isCornerDisabled
          ? 'other'
          : undefined

      seats.push({
        id: seatId,
        venueId: 'venue-005',
        floorId: 'floor-001',
        zoneId: 'zone-008',
        zoneName: '池座区', // ✅ 冗余字段（用于快速显示）
        zoneColor: '#FF6B6B', // ✅ 冗余字段（用于渲染）
        rowLabel: String(row),
        seatLabel: String(seat),
        status: isDisabled ? 'disabled' : 'available',
        disabledReason, // ✅ 修正：使用正确的枚举值
        x: poolStartX + (seat - 1) * HORIZONTAL_SPACING,
        y: poolStartY + (row - 1) * VERTICAL_SPACING,
        createdAt: baseTime,
        updatedAt: baseTime,
      })
    }
  }

  // ✅ 楼座区（二层，floor-002）- 10排 x 20座
  // 起始位置：左侧包厢区域
  const balconyStartX = -500 // 左侧，20座居中
  const balconyStartY = -200 // 与VIP包厢同高

  for (let row = 1; row <= 10; row++) {
    for (let seat = 1; seat <= 20; seat++) {
      const seatId = `seat-v5-${String(++seatIndex).padStart(4, '0')}`

      // ✅ 真实场景：第10排（最后一排）第20座 - 消防通道（其他原因）
      const isDisabled = row === 10 && seat === 20

      seats.push({
        id: seatId,
        venueId: 'venue-005',
        floorId: 'floor-002',
        zoneId: 'zone-009',
        zoneName: '楼座区', // ✅ 冗余字段（用于快速显示）
        zoneColor: '#4ECDC4', // ✅ 冗余字段（用于渲染）
        rowLabel: String(row),
        seatLabel: String(seat),
        status: isDisabled ? 'disabled' : 'available',
        disabledReason: isDisabled ? 'other' : undefined, // ✅ 修正：使用正确的枚举值
        x: balconyStartX + (seat - 1) * HORIZONTAL_SPACING,
        y: balconyStartY + (row - 1) * VERTICAL_SPACING,
        createdAt: baseTime,
        updatedAt: baseTime,
      })
    }
  }

  return seats
}

function initializeShowUidMap() {
  mockShows.forEach((show, index) => {
    const uid = extractDigits(show.id) || index + 1
    showUidToIdMap.set(uid, show.id)
    showIdToUidMap.set(show.id, uid)
  })
}

function extractDigits(value?: string | number | null): number {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? 0 : value
  }
  if (typeof value === 'string') {
    const digits = value.match(/\d+/g)?.join('')
    if (digits) {
      const parsed = Number(digits)
      if (!Number.isNaN(parsed)) return parsed
    }
  }
  return 0
}

const dtoShowTypeToLegacy: Record<number, Show['type']> = {
  1: 'live_show',
  2: 'musical',
  3: 'drama',
  4: 'concert',
  5: 'other',
}

const legacyShowTypeToDto: Record<Show['type'], number> = {
  live_show: 1,
  musical: 2,
  drama: 3,
  concert: 4,
  other: 5,
}

const dtoStatusToLegacy: Record<string, Show['status']> = {
  '1': 'on_sale',
  '2': 'draft',
  '3': 'off_sale',
  '4': 'finished',
}

const legacyStatusToDto: Record<Show['status'], string> = {
  draft: '2',
  on_sale: '1',
  off_sale: '3',
  finished: '4',
}

function resolveVenueInfoByUid(uid?: number) {
  if (!uid) {
    return { id: '', name: '' }
  }
  const venue = mockVenues.find((v) => extractDigits(v.id) === uid)
  if (venue) {
    return { id: venue.id, name: venue.name }
  }
  return { id: `venue-${uid}`, name: '' }
}

function mapShowDtoToLegacy(
  dto: ShowDto,
  showId: string,
  existingShow?: Show,
): {
  show: Show
  sessions: ShowSession[]
  priceTiers: ShowPriceTier[]
} {
  const now = new Date().toISOString().split('T')[0]
  const createdAt = existingShow?.createdAt || now
  const updatedAt = now
  const venueInfo = resolveVenueInfoByUid(dto.VenueUid)

  const show: Show = {
    id: showId,
    merchantId: existingShow?.merchantId || 'merchant-001',
    venueId: venueInfo.id || existingShow?.venueId || '',
    venueName: venueInfo.name || existingShow?.venueName,
    name: dto.ShowName,
    type: dtoShowTypeToLegacy[dto.ShowType] || existingShow?.type || 'other',
    coverImage: dto.CoverImages || existingShow?.coverImage,
    description: dto.Description || existingShow?.description,
    status: dtoStatusToLegacy[dto.ShowStatus] || existingShow?.status || 'draft',
    sessionCount: dto.Sessions?.length || existingShow?.sessionCount || 0,
    nextSessionTime: existingShow?.nextSessionTime,
    createdAt,
    updatedAt,
  }

  const sessions: ShowSession[] = (dto.Sessions || []).map((session, index) => ({
    id: `${showId}-session-${index + 1}`,
    showId,
    venueId: show.venueId,
    date: session.Date,
    startTime: session.StartTime,
    durationMinutes: session.DurationMinutes,
    openTime: undefined,
    status: 'scheduled',
    createdAt,
    updatedAt,
  }))

  const basePriceTiers = (dto.Sessions?.[0]?.PriceTiers || []).map((tier, index) => ({
    id: `${showId}-tier-${index + 1}`,
    showId,
    name: tier.PriceTierName,
    price: tier.Price,
    zoneIds: tier.VenueZoneUid ? [String(tier.VenueZoneUid)] : [],
    color: undefined,
    remark: undefined,
    createdAt,
    updatedAt,
  }))

  return {
    show,
    sessions,
    priceTiers: basePriceTiers,
  }
}

function mapLegacyShowToDto(showId: string, show: Show): ShowDto {
  const sessions = mockSessions[showId] || []
  const priceTiers = mockPriceTiers[showId] || []
  const uid = showIdToUidMap.get(showId) || extractDigits(showId) || Date.now()

  return {
    Uid: uid,
    VenueUid: extractDigits(show.venueId),
    ShowName: show.name,
    ShowType: legacyShowTypeToDto[show.type] || 5,
    CoverImages: show.coverImage || [],
    Description: show.description || '',
    DetailsIncludeRule: '',
    DetailsBookingRule: '',
    DetailsRefundRule: '',
    DetailsSafetyNotice: '',
    DetailImages: [],
    ShowStatus: legacyStatusToDto[show.status] || '2',
    OnlineTimeType: null,
    OnlineTime: null,
    OfflineTimeType: null,
    OfflineTime: null,
    AssignUsersForSale: [],
    OrderChannels: [],
    NeedRiskNotice: 0,
    RiskNoticeMode: 0,
    RiskNoticeText: '',
    RiskNoticeFileName: '',
    EnableGroupTicket: 0,
    GroupTicketMinQuantity: null,
    TimeLengthForAutoCancel: null,
    MaxQuantityForPerIdentity: null,
    TimeLengthForStopSale: 0,
    AssignUsersForVerify: [],
    PickupTimeType: 0,
    PrintMode: 0,
    PrintTiming: 0,
    PrintTemplateUid: 0,
    PrintPriceType: 0,
    CustomPrintPrice: null,
    CheckingWay: [],
    VerifyTimeType: 0,
    VerifyTimeBeforeHours: null,
    VerifyTimeBeforeMinutes: null,
    VerifyTimeAfterHours: null,
    VerifyTimeAfterMinutes: null,
    RefundRuleType: 0,
    RefundDeadlineMinutesBeforeShow: null,
    NeedRefundFee: 0,
    RefundFeeMode: null,
    RefundFeeFixedUnit: null,
    RefundFeeFixedValue: null,
    RefundFeeLadderRules: [],
    RefundAuditMode: 0,
    OverdueOperationType: 0,
    Sessions: sessions.map((session) => ({
      Date: session.date,
      StartTime: session.startTime,
      DurationMinutes: session.durationMinutes,
      PriceTiers: priceTiers.map((tier) => ({
        PriceTierName: tier.name,
        Price: tier.price,
        VenueZoneUid: extractDigits(tier.zoneIds?.[0] || 0),
        Stock: 0,
      })),
    })),
  }
}

// Mock 演出数据
const mockShows: Show[] = [
  {
    id: 'show-001',
    merchantId: 'merchant-001',
    venueId: 'venue-001',
    venueName: '大剧场',
    venueCapacityType: 'precise_seat', // ✅ 场馆容量类型
    name: '夜游山水实景演出',
    type: 'live_show',
    suitableAudience: ['all_ages'],
    coverImage: ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800'],
    description:
      '沉浸式山水光影秀，演绎千年文化传奇。大型实景演出，融合山水自然景观与现代科技，讲述当地历史文化故事。',
    status: 'on_sale',
    sessionCount: 12,
    nextSessionTime: '2025-12-15 19:30:00',
    createdAt: '2025-11-01',
    updatedAt: '2025-12-10',
  },
  {
    id: 'show-002',
    merchantId: 'merchant-001',
    venueId: 'venue-002',
    venueName: '水上实景剧场',
    venueCapacityType: 'zone_capacity', // ✅ 场馆容量类型
    name: '水舞光影秀',
    type: 'live_show',
    suitableAudience: ['children', 'teenager', 'adult'],
    coverImage: ['https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800'],
    description: '水上实景，光影交织。以水为舞台，融合喷泉、灯光、激光打造的视觉盛宴。',
    status: 'on_sale',
    sessionCount: 8,
    nextSessionTime: '2025-12-14 20:00:00',
    createdAt: '2025-10-15',
    updatedAt: '2025-12-09',
  },
  {
    id: 'show-003',
    merchantId: 'merchant-001',
    venueId: 'venue-003',
    venueName: '小剧场',
    venueCapacityType: 'free_seating', // ✅ 场馆容量类型
    name: '亲子音乐会',
    type: 'concert',
    suitableAudience: ['children', 'adult'],
    coverImage: ['https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800'],
    description: '适合全家观看的温馨音乐会，精选儿童喜爱的经典乐曲，专业乐团现场演奏。',
    status: 'draft',
    sessionCount: 0,
    createdAt: '2025-12-01',
    updatedAt: '2025-12-05',
  },
  {
    id: 'show-004',
    merchantId: 'merchant-001',
    venueId: 'venue-001',
    venueName: '大剧场',
    venueCapacityType: 'precise_seat', // ✅ 场馆容量类型
    name: '经典话剧《雷雨》',
    type: 'drama',
    suitableAudience: ['teenager', 'adult'],
    coverImage: ['https://images.unsplash.com/photo-1503095396549-807759245b35?w=800'],
    description: '国家话剧院经典重现，中国现代戏剧的经典之作，由国家话剧院原班人马演出。',
    status: 'off_sale',
    sessionCount: 5,
    nextSessionTime: '2025-12-20 19:00:00',
    createdAt: '2025-09-01',
    updatedAt: '2025-12-01',
  },
  {
    id: 'show-005',
    merchantId: 'merchant-001',
    venueId: 'venue-001',
    venueName: '大剧场',
    venueCapacityType: 'precise_seat', // ✅ 场馆容量类型
    name: '新年音乐会',
    type: 'concert',
    suitableAudience: ['all_ages'],
    coverImage: ['https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800'],
    status: 'finished',
    sessionCount: 2,
    createdAt: '2024-11-01',
    updatedAt: '2025-01-02',
  },
  {
    id: 'show-006',
    merchantId: 'merchant-001',
    venueId: 'venue-005',
    venueName: '梦幻音乐厅',
    venueCapacityType: 'precise_seat', // ✅ 场馆容量类型
    name: '古典音乐之夜',
    type: 'concert',
    suitableAudience: ['adult', 'elderly'],
    coverImage: ['https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800'],
    description: '享受纯粹的古典音乐魅力。由国际知名指挥家执棒，演奏贝多芬、莫扎特等大师经典曲目。',
    status: 'on_sale',
    sessionCount: 6,
    nextSessionTime: '2025-12-18 19:30:00',
    createdAt: '2025-11-10',
    updatedAt: '2025-12-15',
  },
]

const showUidToIdMap = new Map<number, string>()
const showIdToUidMap = new Map<string, number>()

initializeShowUidMap()

// Mock 场次数据
const mockSessions: Record<string, ShowSession[]> = {
  'show-001': [
    {
      id: 'session-001',
      showId: 'show-001',
      venueId: 'venue-001',
      date: '2025-12-15',
      startTime: '19:30',
      durationMinutes: 90,
      openTime: '19:00',
      createdAt: '2025-11-01',
      updatedAt: '2025-11-01',
    },
    {
      id: 'session-002',
      showId: 'show-001',
      venueId: 'venue-001',
      date: '2025-12-16',
      startTime: '19:30',
      durationMinutes: 90,
      openTime: '19:00',
      createdAt: '2025-11-01',
      updatedAt: '2025-11-01',
    },
    {
      id: 'session-003',
      showId: 'show-001',
      venueId: 'venue-001',
      date: '2025-12-22',
      startTime: '19:30',
      durationMinutes: 90,
      openTime: '19:00',
      createdAt: '2025-11-01',
      updatedAt: '2025-11-01',
    },
    // 额外：为「夜游山水实景演出」增加梦幻音乐厅（venue-005）的场次配置
    // 其中 2025-12-15 这天大剧场 + 梦幻音乐厅都有演出，便于验证多场馆
    {
      id: 'session-007',
      showId: 'show-001',
      venueId: 'venue-005',
      date: '2025-12-18',
      startTime: '19:30',
      durationMinutes: 80,
      openTime: '19:00',
      createdAt: '2025-11-10',
      updatedAt: '2025-11-10',
    },
  ],
  'show-002': [
    {
      id: 'session-004',
      showId: 'show-002',
      venueId: 'venue-002',
      date: '2025-12-14',
      startTime: '20:00',
      durationMinutes: 60,
      openTime: '19:30',
      createdAt: '2025-10-15',
      updatedAt: '2025-10-15',
    },
    {
      id: 'session-005',
      showId: 'show-002',
      venueId: 'venue-002',
      date: '2025-12-15',
      startTime: '20:00',
      durationMinutes: 60,
      openTime: '19:30',
      createdAt: '2025-10-15',
      updatedAt: '2025-10-15',
    },
  ],
}

// Mock 票档数据
const mockPriceTiers: Record<string, ShowPriceTier[]> = {
  'show-001': [
    {
      id: 'tier-001',
      showId: 'show-001',
      name: 'VIP 区',
      price: 680,
      zoneIds: ['zone-001'],
      color: '#FFD700',
      remark: '最佳观演位置',
      createdAt: '2025-11-01',
      updatedAt: '2025-11-01',
    },
    {
      id: 'tier-002',
      showId: 'show-001',
      name: 'A 区',
      price: 480,
      zoneIds: ['zone-002'],
      color: '#FF6B6B',
      createdAt: '2025-11-01',
      updatedAt: '2025-11-01',
    },
    {
      id: 'tier-003',
      showId: 'show-001',
      name: 'B 区',
      price: 280,
      zoneIds: ['zone-003'],
      color: '#4ECDC4',
      createdAt: '2025-11-01',
      updatedAt: '2025-11-01',
    },
    // 梦幻音乐厅（venue-005）：VIP 包厢区 / 池座区 / 楼座区
    {
      id: 'tier-006',
      showId: 'show-001',
      name: 'VIP 包厢区',
      price: 380,
      zoneIds: ['zone-007'], // 二层 VIP 包厢区
      color: '#FF6B6B',
      remark: '梦幻音乐厅二层 VIP 包厢区',
      createdAt: '2025-11-10',
      updatedAt: '2025-11-10',
    },
    {
      id: 'tier-007',
      showId: 'show-001',
      name: '池座区',
      price: 0,
      zoneIds: ['zone-008'], // 一层池座区
      color: '#4ECDC4',
      remark: '梦幻音乐厅一层池座区',
      createdAt: '2025-11-10',
      updatedAt: '2025-11-10',
    },
    {
      id: 'tier-008',
      showId: 'show-001',
      name: '楼座区',
      price: 0,
      zoneIds: ['zone-009'], // 二层楼座区
      color: '#4ECDC4',
      remark: '梦幻音乐厅二层楼座区域',
      createdAt: '2025-11-10',
      updatedAt: '2025-11-10',
    },
  ],
  'show-002': [
    {
      id: 'tier-004',
      showId: 'show-002',
      name: '内场票',
      price: 380,
      zoneIds: ['zone-004'],
      color: '#FF6B6B',
      createdAt: '2025-10-15',
      updatedAt: '2025-10-15',
    },
    {
      id: 'tier-005',
      showId: 'show-002',
      name: '看台票',
      price: 180,
      zoneIds: ['zone-005', 'zone-006'],
      color: '#4ECDC4',
      createdAt: '2025-10-15',
      updatedAt: '2025-10-15',
    },
  ],
}

// Mock 销售规则数据
const mockSalesRules: Record<string, ShowSalesRule> = {
  'show-001': {
    showId: 'show-001',
    saleStartType: 'immediate',
    saleEndType: 'before_show',
    saleEndMinutesBeforeShow: 30,
    allowRefund: true,
    refundDeadlineType: 'before_show',
    refundDeadlineHoursBeforeShow: 24,
    maxPurchasePerOrder: 10,
  },
  'show-002': {
    showId: 'show-002',
    saleStartType: 'immediate',
    saleEndType: 'before_show',
    saleEndMinutesBeforeShow: 60,
    allowRefund: true,
    refundDeadlineType: 'before_show',
    refundDeadlineHoursBeforeShow: 48,
    maxPurchasePerOrder: 8,
  },
}

// ==================== 导出 Mock 数据访问函数 ====================

/**
 * 获取 Mock 场馆数据
 */
export function getMockVenues(): Venue[] {
  return mockVenues
}

/**
 * 获取 Mock 演出数据
 */
export function getMockShows(): Show[] {
  return mockShows
}

// ==================== 场馆管理 Mock ====================

/**
 * 设置场馆列表 Mock
 */
export function setupVenueListMock(mock: MockAdapter) {
  mock.onPost('/theater/venues/list').reply((config) => {
    const params: VenueListRequest = config.data
      ? (JSON.parse(config.data as string) as VenueListRequest)
      : {}
    const { page = 1, pageSize = 10, keyword, status } = params

    // 筛选
    let filteredVenues = [...mockVenues]

    if (keyword) {
      filteredVenues = filteredVenues.filter((venue) => venue.name.includes(keyword))
    }

    if (status) {
      filteredVenues = filteredVenues.filter((venue) => venue.status === status)
    }

    // 分页
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const list = filteredVenues.slice(start, end)

    const response: ApiResponse<VenueListResponse> = {
      code: ApiResponseCode.SUCCESS,
      message: '获取场馆列表成功',
      data: {
        list,
        total: filteredVenues.length,
        page,
        pageSize,
      },
    }

    return [200, response]
  })
}

/**
 * 设置创建场馆 Mock
 */
export function setupCreateVenueMock(mock: MockAdapter) {
  mock.onPost('/theater/venues').reply((config) => {
    const request: CreateVenueRequest = JSON.parse(config.data)

    // ✅ 检查场馆名称是否重复
    const duplicateName = mockVenues.find((v) => v.name === request.name)
    if (duplicateName) {
      const response: ApiResponse<null> = {
        code: ApiResponseCode.INVALID_PARAMS,
        message: `场馆名称"${request.name}"已存在，请使用其他名称`,
        data: null,
      }
      return [400, response]
    }

    const newVenue: Venue = {
      id: 'venue-' + Date.now(),
      merchantId: 'merchant-001',
      name: request.name,
      type: request.type,
      address: request.address,
      description: request.description,
      capacityType: request.capacityType,
      totalCapacity:
        request.capacityType === 'free_seating'
          ? (request as any).totalCapacity
          : request.capacityType === 'zone_capacity'
            ? (request as any).zones.reduce((sum: number, zone: any) => sum + zone.capacity, 0)
            : (request as any).seats?.filter((s: any) => s.status === 'available').length || 0,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }

    mockVenues.push(newVenue)

    const response: ApiResponse<CreateVenueResponse> = {
      code: ApiResponseCode.SUCCESS,
      message: '创建场馆成功',
      data: {
        id: newVenue.id,
      },
    }

    return [200, response]
  })
}

/**
 * 设置场馆详情 Mock
 */
export function setupVenueDetailMock(mock: MockAdapter) {
  mock.onPost('/theater/venues/detail').reply((config) => {
    const body = config.data ? JSON.parse(config.data as string) : {}
    const id = (body as { id?: string }).id
    const venue = id ? mockVenues.find((v) => v.id === id) : undefined

    if (venue) {
      const response: ApiResponse<VenueDetailResponse> = {
        code: ApiResponseCode.SUCCESS,
        message: '获取场馆详情成功',
        data: venue,
      }

      return [200, response]
    } else {
      const response: ApiResponse<null> = {
        code: ApiResponseCode.NOT_FOUND,
        message: '场馆不存在',
        data: null,
      }

      return [404, response]
    }
  })
}

/**
 * 设置更新场馆 Mock
 */
export function setupUpdateVenueMock(mock: MockAdapter) {
  mock.onPost(/\/theater\/venues\/[\w-]+/).reply((config) => {
    const id = config.url?.split('/').pop()
    const request: UpdateVenueRequest = JSON.parse(config.data)
    const venueIndex = mockVenues.findIndex((v) => v.id === id)

    if (venueIndex === -1) {
      const response: ApiResponse<null> = {
        code: ApiResponseCode.NOT_FOUND,
        message: '场馆不存在',
        data: null,
      }
      return [404, response]
    }

    // ✅ 检查场馆名称是否与其他场馆重复（排除自己）
    if (request.name) {
      const duplicateName = mockVenues.find((v) => v.id !== id && v.name === request.name)
      if (duplicateName) {
        const response: ApiResponse<null> = {
          code: ApiResponseCode.INVALID_PARAMS,
          message: `场馆名称"${request.name}"已存在，请使用其他名称`,
          data: null,
        }
        return [400, response]
      }
    }

    mockVenues[venueIndex] = {
      ...mockVenues[venueIndex],
      ...request,
      updatedAt: new Date().toISOString().split('T')[0],
    }

    const response: ApiResponse<VenueDetailResponse> = {
      code: ApiResponseCode.SUCCESS,
      message: '更新场馆成功',
      data: mockVenues[venueIndex],
    }

    return [200, response]
  })
}

/**
 * 设置更新场馆状态 Mock
 */
export function setupUpdateVenueStatusMock(mock: MockAdapter) {
  mock.onPost('/theater/venues/update-status').reply((config) => {
    const request: UpdateVenueStatusRequest = config.data
      ? (JSON.parse(config.data as string) as UpdateVenueStatusRequest)
      : ({ id: '', status: 'inactive' } as UpdateVenueStatusRequest)
    const venueIndex = mockVenues.findIndex((v) => v.id === request.id)

    if (venueIndex !== -1) {
      mockVenues[venueIndex].status = request.status
      mockVenues[venueIndex].updatedAt = new Date().toISOString().split('T')[0]

      const response: ApiResponse<VenueDetailResponse> = {
        code: ApiResponseCode.SUCCESS,
        message: '更新场馆状态成功',
        data: mockVenues[venueIndex],
      }

      return [200, response]
    } else {
      const response: ApiResponse<null> = {
        code: ApiResponseCode.NOT_FOUND,
        message: '场馆不存在',
        data: null,
      }

      return [404, response]
    }
  })
}

/**
 * 设置删除场馆 Mock
 */
export function setupDeleteVenueMock(mock: MockAdapter) {
  mock.onPost('/theater/venues/delete').reply((config) => {
    const body = config.data ? JSON.parse(config.data as string) : {}
    const id = (body as { id?: string }).id
    const index = id ? mockVenues.findIndex((v) => v.id === id) : -1

    if (index === -1) {
      const response: ApiResponse<null> = {
        code: ApiResponseCode.NOT_FOUND,
        message: '场馆不存在',
        data: null,
      }

      return [404, response]
    }

    // 检查是否有关联的演出
    const relatedShows = mockShows.filter((s) => s.venueId === id)
    if (relatedShows.length > 0) {
      const response: ApiResponse<null> = {
        code: ApiResponseCode.INVALID_PARAMS,
        message: `该场馆下有 ${relatedShows.length} 个演出，无法删除`,
        data: null,
      }

      return [400, response]
    }

    // 删除场馆
    mockVenues.splice(index, 1)

    const response: ApiResponse<DeleteVenueResponse> = {
      code: ApiResponseCode.SUCCESS,
      message: '删除场馆成功',
      data: {
        success: true,
      },
    }

    return [200, response]
  })
}

/**
 * 设置场馆锁定状态检查 Mock
 */
export function setupVenueLockStatusMock(mock: MockAdapter) {
  mock.onGet(/\/theater\/venues\/[\w-]+\/lock-status$/).reply((config) => {
    console.log('🔍 Mock 被调用，URL:', config.url)

    const urlParts = config.url?.split('/')
    const venueId = urlParts?.[urlParts.length - 2] // 倒数第二个是 venueId

    console.log('🔍 解析 venueId:', venueId, '所有部分:', urlParts)

    if (!venueId) {
      const response: ApiResponse<null> = {
        code: ApiResponseCode.INVALID_PARAMS,
        message: '场馆 ID 不能为空',
        data: null,
      }
      return [400, response]
    }

    const venue = mockVenues.find((v) => v.id === venueId)

    if (venue) {
      // 模拟订单记录（venue-005 有订单，已锁定）
      const mockOrders: Record<string, number> = {
        'venue-001': 0,
        'venue-005': 10, // 梦幻音乐厅有10个订单
      }

      const totalOrders = mockOrders[venueId] || 0
      console.log('🔍 订单数量:', totalOrders, 'venueId:', venueId)

      // ✅ 有订单的场馆自动锁定
      const isLocked = totalOrders > 0
      const referencedShowCount = ['venue-001', 'venue-005'].includes(venueId) ? 2 : 0
      const lockReason = isLocked ? ('has_orders' as const) : undefined

      const lockStatus: VenueLockStatus = {
        venueId,
        isLocked,
        lockReason,
        referencedShowCount,
        totalOrders,
        lastCheckedAt: new Date().toISOString().split('T')[0],
      }

      console.log('✅ Mock 返回数据:', lockStatus)

      const response: ApiResponse<VenueLockStatus> = {
        code: ApiResponseCode.SUCCESS,
        message: '获取场馆锁定状态成功',
        data: lockStatus,
      }

      return [200, response]
    } else {
      console.log('❌ 场馆不存在:', venueId)
      const response: ApiResponse<null> = {
        code: ApiResponseCode.NOT_FOUND,
        message: '场馆不存在',
        data: null,
      }

      return [404, response]
    }
  })
}

/**
 * 设置复制场馆 Mock
 */
export function setupCopyVenueMock(mock: MockAdapter) {
  mock.onPost('/theater/venues/copy').reply((config) => {
    const request = JSON.parse(config.data) as {
      sourceVenueId: string
      newVenueName?: string
      copySeatData?: boolean
    }

    console.log('📋 复制场馆请求:', request)

    const { sourceVenueId, newVenueName, copySeatData = true } = request

    // 查找源场馆
    const sourceVenue = mockVenues.find((v) => v.id === sourceVenueId)

    if (!sourceVenue) {
      const response: ApiResponse<null> = {
        code: ApiResponseCode.NOT_FOUND,
        message: '源场馆不存在',
        data: null,
      }
      return [404, response]
    }

    // 生成新场馆名称
    const finalVenueName = newVenueName || `${sourceVenue.name} - 副本`

    // ✅ 检查场馆名称是否重复
    const duplicateName = mockVenues.find((v) => v.name === finalVenueName)
    if (duplicateName) {
      const response: ApiResponse<null> = {
        code: ApiResponseCode.INVALID_PARAMS,
        message: `场馆名称"${finalVenueName}"已存在，请使用其他名称`,
        data: null,
      }
      return [400, response]
    }

    // 生成新场馆 ID
    const newVenueId = `venue-${Date.now()}`

    // 复制场馆数据
    const newVenue: Venue = {
      ...sourceVenue,
      id: newVenueId,
      name: finalVenueName,
      status: 'active' as const,
      isLocked: false, // ✅ 新场馆未锁定
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }

    // 如果是精确座位模且需要复制座位数据
    if (sourceVenue.capacityMode === 'precise_seat' && copySeatData) {
      // 深拷贝座位数据
      if (sourceVenue.zones) {
        newVenue.zones = JSON.parse(JSON.stringify(sourceVenue.zones))
      }
      if (sourceVenue.seats) {
        newVenue.seats = JSON.parse(JSON.stringify(sourceVenue.seats))
      }
      if (sourceVenue.floors) {
        newVenue.floors = JSON.parse(JSON.stringify(sourceVenue.floors))
      }
      if (sourceVenue.seatMapConfig) {
        newVenue.seatMapConfig = JSON.parse(JSON.stringify(sourceVenue.seatMapConfig))
      }
    } else {
      // 不复制座位数据，重置为空
      newVenue.zones = []
      newVenue.seats = []
      newVenue.floors = [{ id: 'F1', name: '1层', order: 1 }]
      newVenue.seatMapConfig = {
        canvasWidth: 1200,
        canvasHeight: 800,
        backgroundImage: sourceVenue.seatMapConfig?.backgroundImage,
      }
    }

    // 添加到 mock 数据中
    mockVenues.push(newVenue)

    console.log('✅ 场馆复制成功:', { newVenueId, newVenueName: newVenue.name })

    const response: ApiResponse<{ newVenueId: string; venue: Venue }> = {
      code: ApiResponseCode.SUCCESS,
      message: '复制场馆成功',
      data: {
        newVenueId,
        venue: newVenue,
      },
    }

    return [200, response]
  })
}

// ==================== 演出管理 Mock ====================
export function setupTicketingShowDtoMocks(mock: MockAdapter) {
  mock.onPost('/Ticketing/TicketingShow/ShowList').reply((config) => {
    const request = JSON.parse(config.data || '{}') as ShowListRequestDto
    const page = request.Page ?? 1
    const pageSize = request.PageSize ?? 10
    const keyword = request.Keyword?.trim() || ''
    const venueUid = request.VenueUid ?? null
    const statusFilter = request.ShowStatus ?? 0

    let filtered = [...mockShows]

    if (keyword) {
      filtered = filtered.filter((show) => show.name.includes(keyword))
    }

    if (typeof venueUid === 'number' && venueUid > 0) {
      filtered = filtered.filter((show) => extractDigits(show.venueId) === venueUid)
    }

    const statusKey = statusFilter ? String(statusFilter) : ''
    if (statusKey && dtoStatusToLegacy[statusKey]) {
      filtered = filtered.filter((show) => show.status === dtoStatusToLegacy[statusKey])
    }

    const total = filtered.length
    const start = (page - 1) * pageSize
    const paged = filtered.slice(start, start + pageSize)
    const dtoList = paged.map((show) => mapLegacyShowToDto(show.id, show))

    const response: ApiResponse<{ List: ShowDto[]; Total: number }> = {
      code: ApiResponseCode.SUCCESS,
      message: '获取演出列表成功',
      data: {
        List: dtoList,
        Total: total,
      },
    }

    return [200, response]
  })

  mock.onPost('/Ticketing/TicketingShow/SaveShow').reply((config) => {
    const dto = JSON.parse(config.data) as ShowDto
    let uid = dto.Uid
    if (!uid || uid <= 0) {
      uid = Date.now()
      dto.Uid = uid
    }

    let showId = showUidToIdMap.get(uid)
    if (!showId) {
      showId = `show-${uid}`
      showUidToIdMap.set(uid, showId)
      showIdToUidMap.set(showId, uid)
    }

    const existingIndex = mockShows.findIndex((s) => s.id === showId)
    const existingShow = existingIndex >= 0 ? mockShows[existingIndex] : undefined
    const { show, sessions, priceTiers } = mapShowDtoToLegacy(dto, showId, existingShow)

    if (existingIndex >= 0) {
      mockShows[existingIndex] = show
    } else {
      mockShows.push(show)
    }

    mockSessions[showId] = sessions
    mockPriceTiers[showId] = priceTiers

    const response: ApiResponse<ShowDto> = {
      code: ApiResponseCode.SUCCESS,
      message: '保存演出成功',
      data: dto,
    }

    return [200, response]
  })

  mock.onPost('/Ticketing/PrintTemplate/List').reply(() => {
    const response: ApiResponse<typeof MOCK_PRINT_TEMPLATES> = {
      code: ApiResponseCode.SUCCESS,
      message: '获取打印模板成功',
      data: MOCK_PRINT_TEMPLATES,
    }
    return [200, response]
  })

  mock.onPost('/Ticketing/TicketingShow/ShowDetail').reply((config) => {
    const request = JSON.parse(config.data || '{}') as { Uid?: number }
    const uid = request?.Uid

    if (!uid) {
      const response: ApiResponse<null> = {
        code: ApiResponseCode.INVALID_PARAMS,
        message: 'Uid 不能为空',
        data: null,
      }
      return [400, response]
    }

    if (uid === 1) {
      const response: ApiResponse<ShowDto> = {
        code: ApiResponseCode.SUCCESS,
        message: '获取演出详情成功',
        data: SAMPLE_TICKETING_SHOW_DETAIL,
      }
      return [200, response]
    }

    const showId = showUidToIdMap.get(uid)
    if (!showId) {
      const response: ApiResponse<null> = {
        code: ApiResponseCode.NOT_FOUND,
        message: '演出不存在',
        data: null,
      }
      return [404, response]
    }

    const show = mockShows.find((s) => s.id === showId)
    if (!show) {
      const response: ApiResponse<null> = {
        code: ApiResponseCode.NOT_FOUND,
        message: '演出不存在',
        data: null,
      }
      return [404, response]
    }

    const dto = mapLegacyShowToDto(showId, show)
    showUidToIdMap.set(dto.Uid, showId)
    showIdToUidMap.set(showId, dto.Uid)

    const response: ApiResponse<ShowDto> = {
      code: ApiResponseCode.SUCCESS,
      message: '获取演出详情成功',
      data: dto,
    }

    return [200, response]
  })

  mock.onPost('/Ticketing/TicketingShow/UpdateShowStatus').reply((config) => {
    const payload = JSON.parse(config.data || '{}') as {
      Uid?: number
      ShowStatus?: number | string
    }
    const uid = payload.Uid
    if (!uid) {
      const response: ApiResponse<null> = {
        code: ApiResponseCode.INVALID_PARAMS,
        message: 'Uid 不能为空',
        data: null,
      }
      return [400, response]
    }
    const showId = showUidToIdMap.get(uid)
    if (!showId) {
      const response: ApiResponse<null> = {
        code: ApiResponseCode.NOT_FOUND,
        message: '演出不存在',
        data: null,
      }
      return [404, response]
    }
    const numericStatus =
      typeof payload.ShowStatus === 'number' ? payload.ShowStatus : Number(payload.ShowStatus ?? 0)
    const legacyStatus = dtoStatusToLegacy[String(numericStatus)]
    if (!legacyStatus) {
      const response: ApiResponse<null> = {
        code: ApiResponseCode.INVALID_PARAMS,
        message: '无效的演出状态',
        data: null,
      }
      return [400, response]
    }
    const show = mockShows.find((s) => s.id === showId)
    if (!show) {
      const response: ApiResponse<null> = {
        code: ApiResponseCode.NOT_FOUND,
        message: '演出不存在',
        data: null,
      }
      return [404, response]
    }
    show.status = legacyStatus
    show.updatedAt = new Date().toISOString().split('T')[0]

    const response: ApiResponse<{ success: boolean }> = {
      code: ApiResponseCode.SUCCESS,
      message: '更新状态成功',
      data: { success: true },
    }

    return [200, response]
  })

  mock.onPost('/Ticketing/TicketingShow/DeleteShow').reply((config) => {
    const payload = JSON.parse(config.data || '{}') as { Uid?: number }
    const uid = payload.Uid
    if (!uid) {
      const response: ApiResponse<null> = {
        code: ApiResponseCode.INVALID_PARAMS,
        message: 'Uid 不能为空',
        data: null,
      }
      return [400, response]
    }
    const showId = showUidToIdMap.get(uid)
    if (!showId) {
      const response: ApiResponse<null> = {
        code: ApiResponseCode.NOT_FOUND,
        message: '演出不存在',
        data: null,
      }
      return [404, response]
    }
    const index = mockShows.findIndex((s) => s.id === showId)
    if (index >= 0) {
      mockShows.splice(index, 1)
    }
    delete mockSessions[showId]
    delete mockPriceTiers[showId]
    delete mockSalesRules[showId]
    showUidToIdMap.delete(uid)
    showIdToUidMap.delete(showId)

    const response: ApiResponse<{ success: boolean }> = {
      code: ApiResponseCode.SUCCESS,
      message: '删除演出成功',
      data: { success: true },
    }
    return [200, response]
  })
}

/**
 * 演出管理模块 - 票档与座位映射 Mock API
 *
 * 仅用于前端开发与演示，后续可替换为真实接口调用。
 *
 * @module api/endpoints/show/mock
 */

import type {
  PriceTier,
  ShowSeatPrice,
  CreatePriceTierRequest,
  CreatePriceTierResponse,
  UpdatePriceTierRequest,
  UpdatePriceTierResponse,
  DeletePriceTierResponse,
  GetPriceTierListResponse,
  BatchAssignSeatsToPriceTierRequest,
  BatchAssignSeatsToPriceTierResponse,
  AssignSeatsByZoneRequest,
  AssignSeatsByZoneResponse,
  GetSeatPriceMappingResponse,
  GetShowSeatStatsResponse,
  PriceTierStats,
  UpdateShowSeatStatusRequest,
  UpdateShowSeatStatusResponse,
} from './types'

// ==================== Mock 数据存储 ====================

let mockPriceTiers: PriceTier[] = []
let mockSeatPriceMapping: ShowSeatPrice[] = []
let priceTierIdCounter = 1
let seatPriceMappingIdCounter = 1

// ==================== 辅助函数 ====================

function generatePriceTierId(): string {
  return `tier-${priceTierIdCounter++}`
}

function generateSeatPriceMappingId(): string {
  return `mapping-${seatPriceMappingIdCounter++}`
}

function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

// ==================== 票档 CRUD ====================

export async function createPriceTier(
  request: CreatePriceTierRequest,
): Promise<CreatePriceTierResponse> {
  await new Promise((resolve) => setTimeout(resolve, 200))

  const newTier: PriceTier = {
    id: generatePriceTierId(),
    showId: request.showId,
    name: request.name,
    price: request.price,
    color: request.color,
    remark: request.remark,
    order: request.order ?? mockPriceTiers.length,
    createdAt: getCurrentTimestamp(),
  }

  mockPriceTiers.push(newTier)

  return {
    id: newTier.id,
    showId: newTier.showId,
    name: newTier.name,
    price: newTier.price,
    color: newTier.color,
    order: newTier.order,
    createdAt: newTier.createdAt,
  }
}

export async function updatePriceTier(
  tierId: string,
  request: UpdatePriceTierRequest,
): Promise<UpdatePriceTierResponse> {
  await new Promise((resolve) => setTimeout(resolve, 200))

  const tier = mockPriceTiers.find((t) => t.id === tierId)
  if (!tier) {
    throw new Error('票档不存在')
  }

  Object.assign(tier, request, { updatedAt: getCurrentTimestamp() })

  return tier
}

export async function deletePriceTier(tierId: string): Promise<DeletePriceTierResponse> {
  await new Promise((resolve) => setTimeout(resolve, 200))

  const index = mockPriceTiers.findIndex((t) => t.id === tierId)
  if (index === -1) {
    throw new Error('票档不存在')
  }

  mockPriceTiers.splice(index, 1)

  // 删除关联的座位映射
  mockSeatPriceMapping = mockSeatPriceMapping.filter((m) => m.priceTierId !== tierId)

  return {
    success: true,
    deletedId: tierId,
  }
}

export async function getPriceTierList(showId: string): Promise<GetPriceTierListResponse> {
  await new Promise((resolve) => setTimeout(resolve, 150))

  const list = mockPriceTiers
    .filter((t) => t.showId === showId)
    .sort((a, b) => a.order - b.order)

  return {
    list,
    total: list.length,
  }
}

// ==================== 座位-票档映射 ====================

export async function batchAssignSeatsToPriceTier(
  request: BatchAssignSeatsToPriceTierRequest,
): Promise<BatchAssignSeatsToPriceTierResponse> {
  await new Promise((resolve) => setTimeout(resolve, 200))

  const { showId, priceTierId, seatIds } = request

  // 先删除已有映射（同一场演出中一个座位只属于一个票档）
  mockSeatPriceMapping = mockSeatPriceMapping.filter(
    (m) => !seatIds.includes(m.seatId) || m.showId !== showId,
  )

  const newMappings: ShowSeatPrice[] = seatIds.map((seatId) => ({
    id: generateSeatPriceMappingId(),
    showId,
    seatId,
    priceTierId,
    createdAt: getCurrentTimestamp(),
  }))

  mockSeatPriceMapping.push(...newMappings)

  return {
    created: newMappings.length,
    priceTierId,
    showId,
  }
}

export async function assignSeatsByZone(
  request: AssignSeatsByZoneRequest,
  seats: Array<{ id: string; zoneId?: string }>,
  zones: Array<{ id: string; name: string }>,
): Promise<AssignSeatsByZoneResponse> {
  await new Promise((resolve) => setTimeout(resolve, 200))

  const { showId, priceTierId, zoneId } = request

  const zone = zones.find((z) => z.id === zoneId)
  if (!zone) {
    throw new Error('座区不存在')
  }

  const seatsInZone = seats.filter((s) => s.zoneId === zoneId)
  const seatIds = seatsInZone.map((s) => s.id)

  const result = await batchAssignSeatsToPriceTier({
    showId,
    priceTierId,
    seatIds,
  })

  return {
    created: result.created,
    zoneId,
    zoneName: zone.name,
    priceTierId,
  }
}

export async function getSeatPriceMapping(showId: string): Promise<GetSeatPriceMappingResponse> {
  await new Promise((resolve) => setTimeout(resolve, 150))

  const list = mockSeatPriceMapping.filter((m) => m.showId === showId)

  return {
    list,
    total: list.length,
  }
}

export async function getShowSeatStats(
  showId: string,
  totalSeats: number,
): Promise<GetShowSeatStatsResponse> {
  await new Promise((resolve) => setTimeout(resolve, 150))

  const mappings = mockSeatPriceMapping.filter((m) => m.showId === showId)
  const tiers = mockPriceTiers.filter((t) => t.showId === showId)

  const priceTierStats: PriceTierStats[] = tiers.map((tier) => {
    const tierMappings = mappings.filter((m) => m.priceTierId === tier.id)
    const assignedCount = tierMappings.length
    const totalRevenue = assignedCount * tier.price

    return {
      priceTierId: tier.id,
      priceTierName: tier.name,
      assignedCount,
      totalRevenue,
    }
  })

  return {
    totalSeats,
    assignedSeats: mappings.length,
    unassignedSeats: totalSeats - mappings.length,
    priceTiers: priceTierStats,
  }
}

// ==================== 更新演出级座位状态（禁用/恢复） ====================

/**
 * Map<showId, Map<seatId, reason>>
 */
const mockShowDisabledSeats = new Map<string, Map<string, string>>()

export async function updateShowSeatStatus(
  request: UpdateShowSeatStatusRequest,
): Promise<UpdateShowSeatStatusResponse> {
  await new Promise((resolve) => setTimeout(resolve, 200))

  const { showId, seatIds, isDisabled, reason } = request

  if (!mockShowDisabledSeats.has(showId)) {
    mockShowDisabledSeats.set(showId, new Map())
  }

  const disabledSeatsMap = mockShowDisabledSeats.get(showId)!

  if (isDisabled) {
    seatIds.forEach((seatId) => {
      disabledSeatsMap.set(seatId, reason || 'other')
    })
  } else {
    seatIds.forEach((seatId) => {
      disabledSeatsMap.delete(seatId)
    })
  }

  return {
    success: true,
    affectedCount: seatIds.length,
  }
}

// ==================== 重置与初始化（测试用） ====================

export function resetMockData() {
  mockPriceTiers = []
  mockSeatPriceMapping = []
  priceTierIdCounter = 1
  seatPriceMappingIdCounter = 1
}

export function initializeMockData(showId: string) {
  resetMockData()

  const exampleTiers: Omit<PriceTier, 'id' | 'createdAt'>[] = [
    {
      showId,
      name: 'VIP',
      price: 98000,
      color: '#f5222d',
      order: 0,
      remark: '含尊享福利',
    },
    {
      showId,
      name: 'A区',
      price: 68000,
      color: '#52c41a',
      order: 1,
    },
    {
      showId,
      name: 'B区',
      price: 48000,
      color: '#faad14',
      order: 2,
    },
  ]

  mockPriceTiers = exampleTiers.map((tier, index) => ({
    ...tier,
    id: `tier-${index + 1}`,
    createdAt: getCurrentTimestamp(),
  }))

  priceTierIdCounter = mockPriceTiers.length + 1
}


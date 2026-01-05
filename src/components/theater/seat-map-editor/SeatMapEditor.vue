<script setup lang="ts">
import { computed, onMounted, ref, watch, reactive } from 'vue'
import type { TheaterData, Floor, Seat, Stage, Zone, PriceTier } from './types.simplified'
import SeatMapEditorLayout from './components/SeatMapEditorLayout.vue'
import TopToolbar from './components/TopToolbar.vue'
import BatchGenerateModal from './modals/BatchGenerateModal.vue'
import RightPanel from './components/RightPanel.vue'
import ShowModeRightPanel from './components/ShowModeRightPanel.vue'
import TheaterCanvasSimplified from './canvas/TheaterCanvasSimplified.vue'
import BottomStatusBar from './components/BottomStatusBar.full.vue'
import KeyboardShortcutsModal from './modals/KeyboardShortcutsModal.vue'
import LeftPanel from './components/LeftPanel.vue'
import ShowModeLeftPanel from './components/ShowModeLeftPanel.vue'
import FloorManagerModal from './modals/FloorManagerModal.vue'
import RenumberModal from './modals/RenumberModal.vue'
import SingleSeatModal from './modals/SingleSeatModal.vue'
import ImportDataModal from './modals/ImportDataModal.vue'
import ExportPanel from './components/ExportPanel.vue'
import ContextMenu from './components/ContextMenu.vue'
import ZoneConfigModal from './modals/ZoneConfigModal.vue'
import { generateBatchSeats, generatePriceTiersFromZones, autoAssignSeatsToPriceTiers } from './utils/migration.utils'
import { ZONE_PRESET_COLORS } from './utils/constants'
import type { BatchGenerateConfig } from './types.simplified'
import type { VenueSeatStatus, SeatDisabledReason } from '@/types/theater'
import { useHistory } from './composables/useHistory'
import type { CanvasViewport } from './canvas/canvas.utils'
import { snapToGrid } from './canvas/canvas.utils'
import message from 'ant-design-vue/es/message'
import Modal from 'ant-design-vue/es/modal'
import { useCanvasResize } from './composables/useCanvasResize'

const props = defineProps<{
  initialData?: Partial<TheaterData> | any
  /** 是否嵌入在 AntD Modal 中，用于调整高度与布局以避免底部被 ant-modal-footer 遮挡 */
  isInModal?: boolean
  /** 使用场景：'venue' 场馆管理 / 'show' 演出票档配置（预留，当前主要用于场馆模式） */
  mode?: 'venue' | 'show'
}>()

const emit = defineEmits<{
  (e: 'change', data: TheaterData): void
  (e: 'ready'): void
}>()

const editorMode = computed(() => props.mode ?? 'venue')
const isInModalLayout = computed(() => props.isInModal !== false)
const leftPanelWidth = computed(() => (editorMode.value === 'show' ? 300 : 240))

const floors = ref<Floor[]>([])
const zones = ref<Zone[]>([])
const priceTiers = ref<PriceTier[]>([])
const clipboard = ref<Seat[]>([])
const contextMenuPos = ref<{ x: number; y: number } | null>(null)

type SelectedElement =
  | { type: 'seat'; id: string }
  | { type: 'seats'; ids: string[] }
  | { type: 'stage'; id: string }
  | null

type RenumberConfig = {
  direction: 'horizontal' | 'vertical'
  startRowNumber: number
  startSeatNumber: number
  rowIncrement: number
  seatIncrement: number
}

const {
  state: seatsState,
  setState: setSeats,
  undo,
  redo,
  canUndo,
  canRedo,
} = useHistory<Seat[]>([], 50)

const seats = computed<Seat[]>(() => seatsState.value)
const stage = ref<Stage | undefined>(undefined)
const activeFloorId = ref<string>('')
const showSeatLabels = ref(true)
const selectedSeatIds = ref<string[]>([])
const selectedElement = ref<SelectedElement>(null)
const canvasCompRef = ref<any>(null)
const canvasContainerRef = ref<HTMLDivElement | null>(null)
const viewport = ref<CanvasViewport>({
  offsetX: 0,
  offsetY: 0,
  scale: 1,
})
const zoomLevel = ref(100)
const batchVisible = ref(false)
const shortcutsVisible = ref(false)
const floorManagerVisible = ref(false)
const renumberModalVisible = ref(false)
const singleSeatModalVisible = ref(false)
const editingSeat = ref<Seat | null>(null)
const exportModalVisible = ref(false)
const zoneConfigModalVisible = ref(false)
const uiState = reactive({
  importVisible: false,
})

const isFullscreen = ref(false)

const canvasSize = useCanvasResize(canvasContainerRef, 0)
const canvasWidth = computed(() => canvasSize.value.width)
const canvasHeight = computed(() => canvasSize.value.height)

const allSeatsStats = computed(() => {
  const list = seats.value || []
  const total = list.length
  const available = list.filter((s: Seat) => s.status === 'available').length
  const disabled = list.filter((s: Seat) => s.status === 'disabled').length
  return {
    total,
    available,
    disabled,
  }
})

const currentFloorSeats = computed(() =>
  (seats.value || []).filter((s: Seat) => s.floorId === activeFloorId.value),
)

const selectedSeats = computed<Seat[]>(() =>
  seats.value.filter((s: Seat) => selectedSeatIds.value.includes(s.id)),
)

const currentFloor = computed<Floor | undefined>(() =>
  floors.value.find((f: Floor) => f.id === activeFloorId.value),
)

const bottomStatistics = computed(() => ({
  floorCount: floors.value.length,
  totalSeats: allSeatsStats.value.total,
  availableSeats: allSeatsStats.value.available,
  unavailableSeats: allSeatsStats.value.disabled,
  selectedCount: selectedSeatIds.value.length,
  zoneCount: zones.value.length,
}))

const theaterDataForExport = computed<TheaterData>(() => {
  const base = (props.initialData || {}) as any
  return {
    id: base?.id || `theater-${Date.now()}`,
    name: base?.name || '新剧场',
    venueId: base?.venueId,
    floors: floors.value,
    seats: seats.value,
    stage: stage.value,
    zones: zones.value.length ? zones.value : base?.zones || [],
    priceTiers: priceTiers.value.length ? priceTiers.value : base?.priceTiers || [],
    viewport: viewport.value,
    metadata: base?.metadata,
  }
})

const hoveredSeatId = ref<string | null>(null)
const hoveredSeatStatusText = computed(() => {
  if (!hoveredSeatId.value) return ''
  const seat = seats.value.find((s: Seat) => s.id === hoveredSeatId.value)
  if (!seat || seat.status !== 'disabled') return ''

  if (seat.disabledReason === 'equipment') {
    return '设备占用'
  }
  if (seat.disabledReason === 'maintenance') {
    return '维护中'
  }
  if (seat.disabledReason === 'other') {
    return '其他原因禁用'
  }

  return '场馆级禁用'
})

const canvasElement = computed<HTMLCanvasElement | null>(() => {
  return (canvasCompRef.value as any)?.getCanvas?.() ?? null
})

const viewportInitialized = ref(false)

const computeContentCenter = () => {
  const xs: number[] = []
  const ys: number[] = []

  ;(seats.value || []).forEach((seat: Seat) => {
    xs.push(seat.x)
    ys.push(seat.y)
  })

  if (stage.value) {
    xs.push(stage.value.x)
    ys.push(stage.value.y)
  }

  if (!xs.length || !ys.length) {
    return { x: 0, y: 0 }
  }

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  }
}

watch(
  () => ({
    width: canvasWidth.value,
    height: canvasHeight.value,
    seatCount: seats.value.length,
    hasStage: !!stage.value,
  }),
  ({ width, height, seatCount, hasStage }) => {
    if (width <= 0 || height <= 0) return

    // 需要有内容（座位或舞台）时才初始化视口，避免在空数据时错误居中到原点
    if (!viewportInitialized.value && (seatCount > 0 || hasStage)) {
      const center = computeContentCenter()
      viewport.value = {
        offsetX: width / 2 - center.x,
        offsetY: height / 2 - center.y,
        scale: 1,
      }
      viewportInitialized.value = true
    }
  },
  { immediate: true },
)

const emitChange = () => {
  const base = (props.initialData || {}) as any
  const data: TheaterData = {
    id: base?.id || `theater-${Date.now()}`,
    name: base?.name || '新剧场',
    venueId: base?.venueId,
    floors: floors.value,
    seats: seats.value,
    stage: stage.value,
    zones: zones.value.length ? zones.value : base?.zones || [],
    priceTiers: priceTiers.value.length ? priceTiers.value : base?.priceTiers || [],
    viewport: viewport.value,
    metadata: base?.metadata,
  }
  emit('change', data)
}

onMounted(() => {
  const base = (props.initialData || {}) as any

  const initialFloors: Floor[] =
    Array.isArray(base.floors) && base.floors.length
      ? (base.floors as Floor[])
      : [
          {
            id: 'F1',
            name: '1F',
            level: 1,
          },
        ]
  floors.value = initialFloors

  // 初始化座位 / 舞台 / 座区
  setSeats(((base.seats as Seat[]) || []) as Seat[], '初始化座位')
  stage.value = base.stage as Stage | undefined
  zones.value = (base.zones as Zone[]) || []
  activeFloorId.value = initialFloors[0]?.id || ''

  // 初始化票档（仅 show 模式下使用）
  if (editorMode.value === 'show') {
    let initialPriceTiers: PriceTier[] = []

    if (Array.isArray(base.priceTiers) && base.priceTiers.length) {
      initialPriceTiers = base.priceTiers as PriceTier[]
    } else if (zones.value.length) {
      initialPriceTiers = generatePriceTiersFromZones(
        zones.value,
        (base.showId as string) || 'temp-show',
      )
    }

    priceTiers.value = initialPriceTiers

    // 自动根据座区为未分配票档的座位分配票档
    if (priceTiers.value.length && seats.value.some((s: Seat) => !s.priceTierId && s.zoneId)) {
      const updatedSeats = autoAssignSeatsToPriceTiers(seats.value, priceTiers.value)
      setSeats(updatedSeats, '自动分配票档')
    }
  }

  emitChange()
  emit('ready')
})

watch([floors, seatsState, stage, zones, priceTiers, viewport], emitChange, { deep: true })

watch(
  () => viewport.value.scale,
  (scale) => {
    zoomLevel.value = Math.round(scale * 100)
  },
  { immediate: true },
)

const updateViewport = (next: CanvasViewport) => {
  viewport.value = next
}

const handleToggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const openBatchModal = () => {
  batchVisible.value = true
}

const handleOpenExport = () => {
  exportModalVisible.value = true
}

const handleBatchOk = (
  config: BatchGenerateConfig & {
    status: VenueSeatStatus
    disabledReason?: SeatDisabledReason
  },
  position: { x: number; y: number },
) => {
  const floorId = activeFloorId.value
  const newSeats = generateBatchSeats(
    {
      startRow: config.startRow,
      startSeat: config.startSeat,
      rowCount: config.rowCount,
      seatsPerRow: config.seatsPerRow,
      rowSpacing: config.rowSpacing,
      seatSpacing: config.seatSpacing,
      status: config.status,
      disabledReason: config.disabledReason,
    },
    floorId,
    position.x,
    position.y,
  )
  setSeats((prev) => [...prev, ...newSeats], '批量生成座位')
  batchVisible.value = false
}

const handleBatchCancel = () => {
  batchVisible.value = false
}

const handleSeatSelect = (ids: string[]) => {
  selectedSeatIds.value = ids
  if (!ids.length) {
    selectedElement.value = null
  } else if (ids.length === 1) {
    selectedElement.value = { type: 'seat', id: ids[0] }
  } else {
    selectedElement.value = { type: 'seats', ids }
  }
}

const handleStageSelect = (stageId: string) => {
  if (!stage.value || stage.value.id !== stageId) return
  selectedSeatIds.value = []
  selectedElement.value = { type: 'stage', id: stageId }
}

const handleSeatMove = (seatId: string, x: number, y: number) => {
  setSeats(
    (prev) =>
      prev.map((seat) =>
        seat.id === seatId
          ? {
              ...seat,
              x,
              y,
            }
          : seat,
      ),
    '移动座位',
  )
}

const handleSeatsMove = (updates: Array<{ id: string; x: number; y: number }>) => {
  const map = new Map(updates.map((u) => [u.id, u]))
  setSeats(
    (prev) =>
      prev.map((seat) => {
        const update = map.get(seat.id)
        if (!update) return seat
        return {
          ...seat,
          x: update.x,
          y: update.y,
        }
      }),
    '批量移动座位',
  )
}

const handleZoomIn = () => {
  const next = Math.min(200, zoomLevel.value + 25)
  viewport.value = {
    ...viewport.value,
    scale: next / 100,
  }
}

const handleZoomOut = () => {
  const next = Math.max(50, zoomLevel.value - 25)
  viewport.value = {
    ...viewport.value,
    scale: next / 100,
  }
}

const handleZoomChange = (val: number) => {
  const clamped = Math.min(200, Math.max(50, val))
  viewport.value = {
    ...viewport.value,
    scale: clamped / 100,
  }
}

const handleToggleSeatLabels = (checked: boolean) => {
  showSeatLabels.value = checked
}

const handleUpdateSeatStatus = (status: VenueSeatStatus, disabledReason?: SeatDisabledReason) => {
  const ids = selectedSeatIds.value
  if (!ids.length) return
  setSeats(
    (prev) =>
      prev.map((seat) =>
        ids.includes(seat.id)
          ? {
              ...seat,
              status,
              disabledReason: status === 'disabled' ? disabledReason : undefined,
            }
          : seat,
      ),
    '更新座位状态',
  )
}

/**
 * 演出模式：将当前选中座位分配到指定票档
 */
const handleAssignSeatsToPriceTier = (priceTierId: string) => {
  const ids = selectedSeatIds.value
  if (!ids.length) return

  const tier = priceTiers.value.find((t: PriceTier) => t.id === priceTierId)
  if (!tier) return

  setSeats(
    (prev) =>
      prev.map((seat) =>
        ids.includes(seat.id)
          ? {
              ...seat,
              priceTierId: tier.id,
              priceTierColor: tier.color,
            }
          : seat,
      ),
    '分配票档',
  )
}

const handleAssignSeatsToPriceTierFromLeft = (priceTierId: string) => {
  handleAssignSeatsToPriceTier(priceTierId)
}

const handleAssignSeatsToPriceTierFromRight = (priceTierId: string) => {
  handleAssignSeatsToPriceTier(priceTierId)
}

/**
 * 演出模式：清除当前选中座位的票档
 */
const handleClearPriceTier = () => {
  const ids = selectedSeatIds.value
  if (!ids.length) return

  setSeats(
    (prev) =>
      prev.map((seat) =>
        ids.includes(seat.id)
          ? {
              ...seat,
              priceTierId: undefined,
              priceTierColor: undefined,
            }
          : seat,
      ),
    '清除票档',
  )
}

/**
 * 演出模式：更新选中座位的演出级状态（临时禁用 / 恢复）
 */
const handleUpdateShowSeatStatus = (isDisabled: boolean, reason?: string) => {
  const ids = selectedSeatIds.value
  if (!ids.length) return

  setSeats(
    (prev) =>
      prev.map((seat) =>
        ids.includes(seat.id)
          ? {
              ...seat,
              isShowDisabled: isDisabled,
              showDisabledReason: isDisabled ? (reason as any) : undefined,
            }
          : seat,
      ),
    '更新演出级座位状态',
  )

  if (isDisabled) {
    message.success(`已禁用 ${ids.length} 个座位（演出级）`)
  } else {
    message.success(`已恢复 ${ids.length} 个座位（演出级）`)
  }
}

// ========== 演出模式：票档配置（左侧面板 + 弹窗） ==========

const PRICE_TIER_PRESET_COLORS = ZONE_PRESET_COLORS

const priceTierModalVisible = ref(false)
const editingPriceTier = ref<PriceTier | null>(null)
const priceTierForm = reactive({
  name: '',
  price: undefined as number | undefined,
  color: '#1890ff',
  order: 1 as number | undefined,
  remark: '',
})

const selectedPriceTierColor = ref<string>(priceTierForm.color)
const priceTierColorInputRef = ref<HTMLInputElement | null>(null)

const openPriceTierModalForCreate = () => {
  editingPriceTier.value = null
  priceTierForm.name = ''
  priceTierForm.price = undefined
  // 默认颜色取预设色板第一个
  priceTierForm.color = PRICE_TIER_PRESET_COLORS[0] || '#1890ff'
  selectedPriceTierColor.value = priceTierForm.color
  // 显示顺序默认取当前最大值 + 1
  const maxOrder = priceTiers.value.reduce(
    (max: number, t: PriceTier) => Math.max(max, t.order || 0),
    0,
  )
  priceTierForm.order = maxOrder + 1
  priceTierForm.remark = ''
  priceTierModalVisible.value = true
}

const openPriceTierModalForEdit = (tier: PriceTier) => {
  editingPriceTier.value = tier
  priceTierForm.name = tier.name
  // 这里直接使用存储值，具体单位由集成方控制（与 ShowPriceTier 转换保持一致）
  priceTierForm.price = tier.price
  priceTierForm.color = tier.color || PRICE_TIER_PRESET_COLORS[0] || '#1890ff'
  selectedPriceTierColor.value = priceTierForm.color
  priceTierForm.order = tier.order || 1
  priceTierForm.remark = tier.remark || ''
  priceTierModalVisible.value = true
}

const handleNewPriceTier = () => {
  openPriceTierModalForCreate()
}

const handleEditPriceTier = (tier: PriceTier) => {
  openPriceTierModalForEdit(tier)
}

const handleDeletePriceTier = (tierId: string) => {
  const tier = priceTiers.value.find((t: PriceTier) => t.id === tierId)
  if (!tier) return

  // 统计已分配座位数量
  const assignedSeatCount = seats.value.filter((s: Seat) => s.priceTierId === tierId).length

  const content =
    assignedSeatCount > 0
      ? `该票档已分配 ${assignedSeatCount} 个座位，删除后这些座位将变为未分配状态，确定要删除吗？`
      : '确定要删除该票档吗？'

  Modal.confirm({
    title: '删除票档',
    content,
    okText: '删除',
    okType: 'danger' as any,
    cancelText: '取消',
    centered: true,
    onOk: () => {
      priceTiers.value = priceTiers.value.filter((t: PriceTier) => t.id !== tierId)
      // 清空已分配到该票档的座位
      if (assignedSeatCount > 0) {
        setSeats(
          (prev) =>
            prev.map((seat) =>
              seat.priceTierId === tierId
                ? {
                    ...seat,
                    priceTierId: undefined,
                    priceTierColor: undefined,
                  }
                : seat,
            ),
          '删除票档并清除座位票档',
        )
      }
    },
  } as any)
}

watch(
  () => priceTierForm.color,
  (val) => {
    if (val) {
      selectedPriceTierColor.value = val
    }
  },
)

const handlePriceTierNativeColorChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value
  if (!value) return
  selectedPriceTierColor.value = value
  priceTierForm.color = value
}

const openPriceTierNativeColorPicker = () => {
  priceTierColorInputRef.value?.click()
}

const handlePriceTierModalOk = () => {
  const name = priceTierForm.name.trim()
  if (!name) {
    message.error('请输入票档名称')
    return
  }

  const price = priceTierForm.price
  if (price == null || price <= 0) {
    message.error('请输入有效的票价')
    return
  }

  const order = priceTierForm.order ?? 1
  if (!Number.isFinite(order) || order <= 0) {
    message.error('显示顺序必须大于 0')
    return
  }

  const color = priceTierForm.color || '#1890ff'
  const remark = priceTierForm.remark?.trim() || undefined

  if (editingPriceTier.value) {
    // 更新
    const id = editingPriceTier.value.id
    priceTiers.value = priceTiers.value.map((tier: PriceTier) =>
      tier.id === id
        ? {
            ...tier,
            name,
            price,
            color,
            order,
            remark,
          }
        : tier,
    )
    message.success('票档更新成功')
  } else {
    // 新建，order 取当前最后一个 +1
    const maxOrder = priceTiers.value.reduce(
      (max: number, t: PriceTier) => Math.max(max, t.order || 0),
      0,
    )
    const newTier: PriceTier = {
      id: `tier-${Date.now()}`,
      showId: (props.initialData as any)?.showId || 'temp-show',
      floorId: activeFloorId.value,
      zoneId: undefined,
      name,
      price,
      color,
      remark,
      order: order || maxOrder + 1,
    }
    priceTiers.value = [...priceTiers.value, newTier]
    message.success('票档创建成功')
  }

  priceTierModalVisible.value = false
}

const handlePriceTierModalCancel = () => {
  priceTierModalVisible.value = false
}

const handleDeleteSeats = () => {
  const ids = selectedSeatIds.value
  if (!ids.length) return
  setSeats((prev) => prev.filter((seat) => !ids.includes(seat.id)), '删除座位')
  selectedSeatIds.value = []
  selectedElement.value = null
}

const handleAddStage = () => {
  if (stage.value) {
    // 已存在舞台，每个场馆只能有一个舞台
    message.warning('已存在舞台，每个场馆只能有一个舞台')
    return
  }

  stage.value = {
    id: `stage_${Date.now()}`,
    // 舞台方向
    name: '舞台方向',
    x: 0,
    y: -250,
    width: 480,
    height: 40,
    shape: 'trapezoid',
    color: '#dedede',
  }
}

const handleUpdateStage = (stageId: string, updates: Partial<Stage>) => {
  if (!stage.value || stage.value.id !== stageId) return
  stage.value = { ...stage.value, ...updates }
}

const handleStageMoveFromCanvas = (stageId: string, x: number, y: number) => {
  handleUpdateStage(stageId, { x, y })
}

const handleDeleteStage = (stageId: string) => {
  if (!stage.value || stage.value.id !== stageId) return
  stage.value = undefined
  if (selectedElement.value?.type === 'stage') {
    selectedElement.value = null
  }
}

const assignSeatsToZoneInternal = (seatIds: string[], zoneId: string) => {
  const zone = zones.value.find((z: Zone) => z.id === zoneId)
  if (!zone) {
    message.error('座区不存在')
    return
  }

  setSeats(
    (prev) =>
      (prev as Seat[]).map((seat: Seat) =>
        seatIds.includes(seat.id)
          ? {
              ...seat,
              zoneId: zone.id,
              zoneName: zone.name,
              zoneColor: zone.color,
            }
          : seat,
      ),
    '分配座区',
  )

  message.success(`已将 ${seatIds.length} 个座位分配到「${zone.name}」`)
}

const handleAssignSeatsToZone = (zoneId: string) => {
  if (!selectedSeatIds.value.length) {
    message.warning('请先选择座位')
    return
  }

  const currentFloorSeatIds = selectedSeatIds.value.filter((seatId: string) => {
    const seat = seats.value.find((s: Seat) => s.id === seatId)
    return seat && seat.floorId === activeFloorId.value
  })

  if (!currentFloorSeatIds.length) {
    message.warning('当前楼层没有选中的座位')
    return
  }

  assignSeatsToZoneInternal(currentFloorSeatIds, zoneId)

  // 与 a 项目一致：批量分配后清空选中
  selectedSeatIds.value = []
  selectedElement.value = null
}

const handleCreateZoneFromSeats = () => {
  if (!selectedSeatIds.value.length) {
    message.warning('请先选择座位')
    return
  }
  zoneConfigModalVisible.value = true
}

const handleZoneConfigOk = (values: {
  name: string
  shortName?: string
  color: string
  order: number
}) => {
  const base = (props.initialData || {}) as any
  const newZone: Zone = {
    id: generateId('zone'),
    venueId: base?.id,
    floorId: activeFloorId.value,
    ...values,
  }

  zones.value = [...zones.value, newZone]
  // 更新座位的座区信息（走命令栈，可撤销）
  setSeats((prev) =>
    (prev as Seat[]).map((seat: Seat) =>
      selectedSeatIds.value.includes(seat.id)
        ? {
            ...seat,
            zoneId: newZone.id,
            zoneName: newZone.name,
            zoneColor: newZone.color,
          }
        : seat,
    ),
  )

  zoneConfigModalVisible.value = false
  message.success(`座区「${newZone.name}」创建成功，已包含 ${selectedSeatIds.value.length} 个座位`)
}

const handleUpdateZone = (zoneId: string, updates: Partial<Zone>) => {
  zones.value = zones.value.map((z: Zone) =>
    z.id === zoneId
      ? {
          ...z,
          ...updates,
        }
      : z,
  )

  if (updates.name || updates.color) {
    const zone = zones.value.find((z: Zone) => z.id === zoneId)
    if (zone) {
      setSeats((prev) =>
        (prev as Seat[]).map((seat: Seat) =>
          seat.zoneId === zoneId
            ? {
                ...seat,
                zoneName: updates.name ?? seat.zoneName,
                zoneColor: updates.color ?? seat.zoneColor,
              }
            : seat,
        ),
      )
    }
  }
}

const handleDeleteZone = (zoneId: string) => {
  zones.value = zones.value.filter((z: Zone) => z.id !== zoneId)
  setSeats(
    (prev) =>
      prev.map((seat: Seat) =>
        seat.zoneId === zoneId
          ? { ...seat, zoneId: undefined, zoneName: undefined, zoneColor: undefined }
          : seat,
      ),
    '删除座区',
  )
}

const handleNewFloor = () => {
  const newFloor: Floor = {
    id: generateId('floor'),
    name: `${floors.value.length + 1}F`,
    level: floors.value.length + 1,
  }
  floors.value = [...floors.value, newFloor]
  activeFloorId.value = newFloor.id
  message.success(`已创建新楼层：${newFloor.name}`)
}

const handleFloorManagerOk = (updatedFloors: Floor[]) => {
  floors.value = [...updatedFloors]
  floorManagerVisible.value = false
  message.success('楼层管理已更新')

  if (!updatedFloors.find((f) => f.id === activeFloorId.value)) {
    const first = updatedFloors[0]
    if (first) {
      activeFloorId.value = first.id
    }
  }
}

const handleRenumberOk = (config: RenumberConfig) => {
  if (!selectedSeats.value.length) {
    renumberModalVisible.value = false
    return
  }

  const sortedSeats = [...selectedSeats.value].sort((a, b) => {
    if (config.direction === 'horizontal') {
      // 水平优先：按行排序
      if (Math.abs(a.y - b.y) < 10) {
        return a.x - b.x
      }
      return a.y - b.y
    }
    // 纵向优先：按列排序
    if (Math.abs(a.x - b.x) < 10) {
      return a.y - b.y
    }
    return a.x - b.x
  })

  let currentRow = config.startRowNumber
  let currentSeat = config.startSeatNumber

  const firstSeat = sortedSeats[0]
  if (!firstSeat) {
    renumberModalVisible.value = false
    return
  }

  let lastCoord = config.direction === 'horizontal' ? firstSeat.y : firstSeat.x

  const updatedSeats = seats.value.map((seat: Seat) => {
    const selectedSeat = sortedSeats.find((s) => s.id === seat.id)
    if (!selectedSeat) return seat

    const coord = config.direction === 'horizontal' ? selectedSeat.y : selectedSeat.x

    if (Math.abs(coord - lastCoord) >= 10) {
      currentRow += config.rowIncrement
      currentSeat = config.startSeatNumber
      lastCoord = coord
    }

    const newSeat: Seat = {
      ...seat,
      rowLabel: String(currentRow),
      seatLabel: String(currentSeat),
    }

    currentSeat += config.seatIncrement
    return newSeat
  })

  setSeats(updatedSeats, '重新编号座位')
  renumberModalVisible.value = false
  message.success('座位编号已更新')
}

const handleOpenSingleSeatEdit = (seat?: Seat) => {
  if (seat) {
    editingSeat.value = seat
  } else if (selectedSeatIds.value.length === 1) {
    editingSeat.value = selectedSeats.value[0]
  } else {
    message.warning('请选择一个座位进行编辑')
    return
  }
  singleSeatModalVisible.value = true
}

const handleSingleSeatOk = (payload: {
  zoneId?: string
  rowLabel: string
  seatLabel: string
  x: number
  y: number
  status: VenueSeatStatus
  disabledReason?: SeatDisabledReason
}) => {
  if (!editingSeat.value) return

  const updates: any = { ...payload }

  if (updates.zoneId) {
    const zone = zones.value.find((z: Zone) => z.id === updates.zoneId)
    if (zone) {
      updates.zoneName = zone.name
      updates.zoneColor = zone.color
    }
  } else {
    updates.zoneName = undefined
    updates.zoneColor = undefined
  }

  const updatedSeats = seats.value.map((s: Seat) =>
    s.id === editingSeat.value?.id ? { ...s, ...updates } : s,
  )

  setSeats(updatedSeats, '编辑单个座位')
  singleSeatModalVisible.value = false
  editingSeat.value = null
  message.success('座位已更新')
}

const handleImportData = (data: TheaterData) => {
  const next = data as TheaterData
  floors.value = Array.isArray(next.floors) ? next.floors : []
  stage.value = next.stage
  zones.value = Array.isArray(next.zones) ? (next.zones as Zone[]) : []
  activeFloorId.value = next.floors[0]?.id || ''
  setSeats(Array.isArray(next.seats) ? (next.seats as Seat[]) : [], '导入座位数据')
  uiState.importVisible = false
  message.success('座位图数据导入成功')
}

const generateId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

const handleSeatsDeleteFromCanvas = (ids: string[]) => {
  if (!ids.length) return
  setSeats((prev) => prev.filter((seat: Seat) => !ids.includes(seat.id)), '删除座位')
  if (ids.some((id) => selectedSeatIds.value.includes(id))) {
    selectedSeatIds.value = []
    selectedElement.value = null
  }
}

const handleSeatsCopyFromCanvas = (ids: string[]) => {
  if (!ids.length) return
  const copiedSeats = seats.value
    .filter((seat: Seat) => ids.includes(seat.id))
    .map((seat: Seat) => ({ ...seat }))
  clipboard.value = copiedSeats
}

const handleSeatsPasteFromCanvas = () => {
  if (!clipboard.value.length) return

  const hasGroup = clipboard.value.some((seat: Seat) => !!seat.groupId)
  const newGroupId = hasGroup ? generateId('group') : undefined

  const pastedSeats = clipboard.value.map((seat: Seat) => ({
    ...seat,
    id: generateId('seat'),
    floorId: activeFloorId.value,
    groupId: newGroupId,
    x: seat.x + 20,
    y: seat.y + 20,
  }))

  setSeats((prev) => [...prev, ...pastedSeats], '复制座位')
  selectedSeatIds.value = pastedSeats.map((s: Seat) => s.id)
  selectedElement.value =
    pastedSeats.length === 1
      ? { type: 'seat', id: pastedSeats[0].id }
      : { type: 'seats', ids: pastedSeats.map((s: Seat) => s.id) }
}

const handleViewportChange = (vp: CanvasViewport) => {
  updateViewport(vp)
}

const renderFloorForExport = async (floorId: string) => {
  activeFloorId.value = floorId
  await new Promise((resolve) => setTimeout(resolve, 0))
}

const handleCanvasContextMenuFromDom = (event: MouseEvent) => {
  const canvasEl = (canvasCompRef.value as any)?.getCanvas?.() as HTMLCanvasElement | null
  if (!canvasEl) return

  const rect = canvasEl.getBoundingClientRect()
  const screenX = event.clientX - rect.left
  const screenY = event.clientY - rect.top

  const vp = viewport.value
  const worldX = (screenX - vp.offsetX) / vp.scale
  const worldY = (screenY - vp.offsetY) / vp.scale

  contextMenuPos.value = { x: worldX, y: worldY }
}

const handleCopySelected = () => {
  if (!selectedSeatIds.value.length) {
    message.warning('请先选择要复制的座位')

    return
  }
  const copiedSeats = seats.value
    .filter((seat: Seat) => selectedSeatIds.value.includes(seat.id))
    .map((seat: Seat) => ({ ...seat }))
  clipboard.value = copiedSeats
  message.success(`已复制 ${copiedSeats.length} 个座位`)
}

const handleCutSelected = () => {
  if (!selectedSeatIds.value.length) {
    message.warning('请先选择要剪切的座位')
    return
  }
  const copiedSeats = seats.value
    .filter((seat: Seat) => selectedSeatIds.value.includes(seat.id))
    .map((seat: Seat) => ({ ...seat }))
  clipboard.value = copiedSeats
  setSeats(
    (prev) => prev.filter((seat: Seat) => !selectedSeatIds.value.includes(seat.id)),
    '剪切座位',
  )
  selectedSeatIds.value = []
  selectedElement.value = null
  message.success(`已剪切${copiedSeats.length}个座位`)
}

const handlePaste = () => {
  handleSeatsPasteFromCanvas()
}

const handlePasteHere = () => {
  if (!clipboard.value.length) {
    message.warning('剪贴板为空')
    return
  }
  if (!contextMenuPos.value) {
    message.warning('无法获取复制位置')
    return
  }
  const minX = Math.min(...clipboard.value.map((s: Seat) => s.x))
  const minY = Math.min(...clipboard.value.map((s: Seat) => s.y))
  const targetX = snapToGrid(contextMenuPos.value.x)
  const targetY = snapToGrid(contextMenuPos.value.y)
  const offsetX = targetX - minX
  const offsetY = targetY - minY
  const hasGroup = clipboard.value.some((seat: Seat) => !!seat.groupId)
  const newGroupId = hasGroup ? generateId('group') : undefined
  const pastedSeats = clipboard.value.map((seat: Seat) => ({
    ...seat,
    id: generateId('seat'),
    floorId: activeFloorId.value,
    groupId: newGroupId,
    x: seat.x + offsetX,
    y: seat.y + offsetY,
  }))
  setSeats((prev) => [...prev, ...pastedSeats], '复制座位到指定位置')
  selectedSeatIds.value = pastedSeats.map((s: Seat) => s.id)
  selectedElement.value =
    pastedSeats.length === 1
      ? { type: 'seat', id: pastedSeats[0].id }
      : { type: 'seats', ids: pastedSeats.map((s: Seat) => s.id) }
  message.success(`已粘贴 ${pastedSeats.length} 个座位到指定位置`)
}

const handleAlignByType = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
  if (selectedSeats.value.length < 2) {
    message.warning('请至少选择 2 个座位进行对齐')
    return
  }
  let updates: Array<{ id: string; x?: number; y?: number }> = []
  switch (type) {
    case 'left': {
      const minX = Math.min(...selectedSeats.value.map((s: Seat) => s.x))
      updates = selectedSeats.value.map((seat: Seat) => ({ id: seat.id, x: minX }))
      break
    }
    case 'center': {
      const minX = Math.min(...selectedSeats.value.map((s: Seat) => s.x))
      const maxX = Math.max(...selectedSeats.value.map((s: Seat) => s.x))
      const centerX = (minX + maxX) / 2
      updates = selectedSeats.value.map((seat: Seat) => ({ id: seat.id, x: centerX - 15 }))
      break
    }
    case 'right': {
      const maxX = Math.max(...selectedSeats.value.map((s: Seat) => s.x))
      updates = selectedSeats.value.map((seat: Seat) => ({ id: seat.id, x: maxX }))
      break
    }
    case 'top': {
      const minY = Math.min(...selectedSeats.value.map((s: Seat) => s.y))
      updates = selectedSeats.value.map((seat: Seat) => ({ id: seat.id, y: minY }))
      break
    }
    case 'middle': {
      const minY = Math.min(...selectedSeats.value.map((s: Seat) => s.y))
      const maxY = Math.max(...selectedSeats.value.map((s: Seat) => s.y))
      const centerY = (minY + maxY) / 2
      updates = selectedSeats.value.map((seat: Seat) => ({ id: seat.id, y: centerY }))
      break
    }
    case 'bottom': {
      const maxY = Math.max(...selectedSeats.value.map((s: Seat) => s.y))
      updates = selectedSeats.value.map((seat: Seat) => ({ id: seat.id, y: maxY }))
      break
    }
  }
  const updatedSeats = seats.value.map((seat: Seat) => {
    const found = updates.find((u) => u.id === seat.id)
    if (!found) return seat
    return {
      ...seat,
      x: found.x ?? seat.x,
      y: found.y ?? seat.y,
    }
  })
  setSeats(updatedSeats, '粘贴座位')
  message.success('已对齐座位')
}

const handleGroup = () => {
  if (selectedSeatIds.value.length < 2) {
    message.warning('请至少选择 2 个座位进行成组')
    return
  }
  const groupId = generateId('group')
  setSeats((prev) =>
    (prev as Seat[]).map((seat) =>
      selectedSeatIds.value.includes(seat.id) ? { ...seat, groupId } : seat,
    ),
  )
  message.success(`已成组 ${selectedSeatIds.value.length} 个座位`)
}

const handleUngroup = () => {
  if (!selectedSeatIds.value.length) {
    message.warning('请先选择座位')
    return
  }
  setSeats((prev) =>
    (prev as Seat[]).map((seat) =>
      selectedSeatIds.value.includes(seat.id) ? { ...seat, groupId: undefined } : seat,
    ),
  )
  message.success(`已取消成组 ${selectedSeatIds.value.length} 个座位`)
}

const handleLock = () => {
  if (!selectedSeatIds.value.length) {
    message.warning('请先选择座位')

    return
  }
  setSeats((prev) =>
    (prev as Seat[]).map((seat) =>
      selectedSeatIds.value.includes(seat.id) ? { ...seat, locked: true } : seat,
    ),
  )
  message.success(`已锁定 ${selectedSeatIds.value.length} 个座位`)
}

const handleUnlock = () => {
  if (!selectedSeatIds.value.length) {
    message.warning('请先选择座位')

    return
  }
  setSeats((prev) =>
    (prev as Seat[]).map((seat) =>
      selectedSeatIds.value.includes(seat.id) ? { ...seat, locked: false } : seat,
    ),
  )
  message.success(`已解锁 ${selectedSeatIds.value.length} 个座位`)
}

const handleDuplicateSelected = () => {
  if (!selectedSeatIds.value.length) {
    message.warning('请先选择要复制的座位')
    return
  }
  const hasGroup = selectedSeats.value.some((seat: Seat) => !!seat.groupId)
  const newGroupId = hasGroup ? generateId('group') : undefined
  const duplicatedSeats = selectedSeats.value.map((seat: Seat) => ({
    ...seat,
    id: generateId('seat'),
    groupId: newGroupId,
    x: seat.x + 30,
    y: seat.y + 30,
  }))
  setSeats((prev) => [...(prev as Seat[]), ...duplicatedSeats])
  selectedSeatIds.value = duplicatedSeats.map((s: Seat) => s.id)
  message.success(`已快速复制 ${duplicatedSeats.length} 个座位`)
}

const handleSelectAll = () => {
  const allSeatIds = currentFloorSeats.value.map((s: Seat) => s.id)
  selectedSeatIds.value = allSeatIds
  selectedElement.value = allSeatIds.length > 0 ? { type: 'seats', ids: allSeatIds } : null
  message.success(`已选中 ${allSeatIds.length} 个座位`)
}

const handleAssignToZoneFromMenu = (zoneId: string) => {
  if (!selectedSeatIds.value.length) {
    message.warning('请先选择座位')
    return
  }

  // 右键菜单分配座区沿用 React 逻辑：不限制楼层
  assignSeatsToZoneInternal([...selectedSeatIds.value], zoneId)
}

const handleRemoveFromZone = () => {
  if (!selectedSeatIds.value.length) {
    message.warning('请先选择座位')

    return
  }
  setSeats((prev) =>
    (prev as Seat[]).map((seat: Seat) =>
      selectedSeatIds.value.includes(seat.id)
        ? { ...seat, zoneId: undefined, zoneName: undefined, zoneColor: undefined }
        : seat,
    ),
  )
  message.success('已从座区移除选中座位')
}

const handleCancelSelection = () => {
  selectedSeatIds.value = []
  selectedElement.value = null
}

const handleZoomReset = () => {
  viewport.value = {
    offsetX: canvasWidth.value / 2,
    offsetY: canvasHeight.value / 2,
    scale: 1,
  }
  message.success('已重置视图')
}

const handleKeyDown = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement
  const isInputElement =
    target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

  if (isInputElement && e.key !== 'Escape') return

  const hasModifier = e.ctrlKey || e.metaKey

  if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputElement) {
    e.preventDefault()

    if (!selectedElement.value) {
      message.warning('请先选择要删除的对象')
      return
    }

    if (selectedElement.value.type === 'stage') {
      if (!stage.value) {
        message.warning('没有可删除的舞台')
        return
      }
      handleDeleteStage(selectedElement.value.id)
      return
    }

    if (selectedElement.value.type === 'seat' || selectedElement.value.type === 'seats') {
      if (!selectedSeatIds.value.length) {
        message.warning('请先选择要删除的座位')
        return
      }
      handleDeleteSeats()
      return
    }

    message.warning('该对象不支持删除')
    return
  }

  if (e.key === 'Escape') {
    e.preventDefault()
    handleCancelSelection()
    return
  }

  if (e.key === 'a' && hasModifier && !e.shiftKey) {
    e.preventDefault()
    handleSelectAll()
    return
  }

  if (e.key === 'c' && hasModifier && !e.shiftKey) {
    e.preventDefault()
    handleCopySelected()
    return
  }

  if (e.key === 'x' && hasModifier && !e.shiftKey) {
    e.preventDefault()
    handleCutSelected()
    return
  }

  if (e.key === 'v' && hasModifier && !e.shiftKey) {
    e.preventDefault()
    handlePaste()
    return
  }

  if (e.key === 'd' && hasModifier && !e.shiftKey) {
    e.preventDefault()
    handleDuplicateSelected()
    return
  }

  if (e.key === 'z' && hasModifier && !e.shiftKey && canUndo.value) {
    e.preventDefault()
    undo()
    return
  }

  if (((e.key === 'z' && e.shiftKey) || e.key === 'y') && hasModifier && canRedo.value) {
    e.preventDefault()
    redo()
    return
  }

  if (e.key === 'Enter' && !isInputElement && selectedSeatIds.value.length === 1) {
    e.preventDefault()
    handleOpenSingleSeatEdit()
    return
  }

  if (e.altKey && !hasModifier && !e.shiftKey && !isInputElement) {
    const alignMap: Record<string, 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'> = {
      a: 'left',
      d: 'right',
      h: 'center',
      w: 'top',
      s: 'bottom',
      v: 'middle',
    }

    const type = alignMap[e.key]
    if (type) {
      e.preventDefault()
      handleAlignByType(type)
      return
    }
  }

  if ((e.key === '=' || e.key === '+') && hasModifier && !e.shiftKey) {
    e.preventDefault()
    handleZoomIn()
    return
  }

  if (e.key === '-' && hasModifier && !e.shiftKey) {
    e.preventDefault()
    handleZoomOut()
    return
  }

  if (e.key === '0' && hasModifier && !e.shiftKey) {
    e.preventDefault()
    handleZoomReset()
    return
  }

  if (e.key === 'g' && hasModifier && !e.shiftKey) {
    e.preventDefault()
    handleGroup()
    return
  }

  if (e.key === 'g' && hasModifier && e.shiftKey) {
    e.preventDefault()
    handleUngroup()
    return
  }

  if (e.key === 'l' && hasModifier && !e.shiftKey) {
    e.preventDefault()
    handleLock()
    return
  }

  if (e.key === 'l' && hasModifier && e.shiftKey) {
    e.preventDefault()
    handleUnlock()
    return
  }

  if (e.key === 'e' && hasModifier && !e.shiftKey) {
    e.preventDefault()
    handleOpenExport()
    return
  }

  if (e.key === 'r' && hasModifier && !e.shiftKey) {
    e.preventDefault()
    renumberModalVisible.value = true
    return
  }

  if (e.key === 'n' && hasModifier && e.shiftKey) {
    e.preventDefault()
    handleNewFloor()
    return
  }

  if (e.key === '?') {
    e.preventDefault()
    shortcutsVisible.value = true
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <SeatMapEditorLayout
    :is-in-modal="isInModalLayout"
    :is-fullscreen="isFullscreen"
    :left-sider-width="leftPanelWidth"
  >
    <template #header>
      <TopToolbar
        :theater-name="(props.initialData as any)?.name || '座位图编辑器'"
        :can-undo="canUndo"
        :can-redo="canRedo"
        :is-fullscreen="isFullscreen"
        :show-seat-labels="showSeatLabels"
        :zoom-level="zoomLevel"
        :is-show-mode="editorMode === 'show'"
        @batch-generate="openBatchModal"
        @add-stage="handleAddStage"
        @toggle-seat-labels="handleToggleSeatLabels"
        @zoom-in="handleZoomIn"
        @zoom-out="handleZoomOut"
        @zoom-change="handleZoomChange"
        @import="() => (uiState.importVisible = true)"
        @export="handleOpenExport"
        @undo="undo"
        @redo="redo"
        @show-shortcuts="shortcutsVisible = true"
        @toggle-fullscreen="handleToggleFullscreen"
      />
    </template>

    <template #left>
      <ShowModeLeftPanel
        v-if="editorMode === 'show'"
        :floors="floors"
        :active-floor-id="activeFloorId"
        :seats="seats"
        :price-tiers="priceTiers"
        :selected-seat-ids="selectedSeatIds"
        @floor-change="(id: string) => (activeFloorId = id)"
        @new-price-tier="handleNewPriceTier"
        @edit-price-tier="handleEditPriceTier"
        @delete-price-tier="handleDeletePriceTier"
        @assign-seats-to-price-tier="handleAssignSeatsToPriceTierFromLeft"
      />
      <LeftPanel
        v-else
        :floors="floors"
        :active-floor-id="activeFloorId"
        :seats="seats"
        :zones="zones"
        @floor-change="(id: string) => (activeFloorId = id)"
        @new-floor="handleNewFloor"
        @manage-floors="floorManagerVisible = true"
      />
    </template>

    <template #canvas>
      <ContextMenu
        :selected-element="selectedElement"
        :selected-seats="selectedSeats"
        :has-clipboard="clipboard.length > 0"
        :has-seats="currentFloorSeats.length > 0"
        :zones="zones.filter((z: Zone) => z.floorId === activeFloorId)"
        @copy="handleCopySelected"
        @cut="handleCutSelected"
        @paste="handlePaste"
        @paste-here="handlePasteHere"
        @duplicate="handleDuplicateSelected"
        @delete="handleDeleteSeats"
        @align="handleAlignByType"
        @lock="handleLock"
        @unlock="handleUnlock"
        @group="handleGroup"
        @ungroup="handleUngroup"
        @edit="() => handleOpenSingleSeatEdit()"
        @renumber="() => (renumberModalVisible = true)"
        @create-zone="handleCreateZoneFromSeats"
        @assign-zone="handleAssignToZoneFromMenu"
        @remove-zone="handleRemoveFromZone"
        @select-all="handleSelectAll"
      >
        <div
          ref="canvasContainerRef"
          style="flex: 1; display: flex"
          @contextmenu="handleCanvasContextMenuFromDom"
        >
          <TheaterCanvasSimplified
            ref="canvasCompRef"
            :seats="currentFloorSeats"
            :stage="stage"
            :selected-seat-ids="selectedSeatIds"
            :selected-element="selectedElement"
            :width="canvasWidth"
            :height="canvasHeight"
            :show-grid="true"
            :enable-snap="true"
          :show-seat-labels="showSeatLabels"
          :viewport="viewport"
          @seat-select="handleSeatSelect"
          @seat-move="handleSeatMove"
          @seats-move="handleSeatsMove"
          @stage-select="handleStageSelect"
          @stage-move="handleStageMoveFromCanvas"
          @viewport-change="handleViewportChange"
          @seats-delete="handleSeatsDeleteFromCanvas"
          @seats-copy="handleSeatsCopyFromCanvas"
          @seats-paste="handleSeatsPasteFromCanvas"
          @seat-hover="(id: string | null) => (hoveredSeatId = id)"
        />
        </div>
      </ContextMenu>
    </template>

    <template #right>
      <ShowModeRightPanel
        v-if="editorMode === 'show'"
        :selected-seats="selectedSeats"
        :price-tiers="priceTiers"
        @assign-price-tier="handleAssignSeatsToPriceTierFromRight"
        @clear-price-tier="handleClearPriceTier"
        @cancel-selection="handleCancelSelection"
        @update-show-seat-status="handleUpdateShowSeatStatus"
        @create-price-tier="handleNewPriceTier"
      />
      <RightPanel
        v-else
        :selected-element="selectedElement"
        :floor="currentFloor"
        :selected-seats="selectedSeats"
        :selected-stage="selectedElement?.type === 'stage' ? stage : undefined"
        :zones="zones"
        :stage="stage"
        :seats="seats"
        :venue-id="(props.initialData as any)?.id || ''"
        :current-floor-id="activeFloorId"
        @update-seat-status="handleUpdateSeatStatus"
        @delete-seats="handleDeleteSeats"
        @create-zone="handleCreateZoneFromSeats"
        @assign-to-zone="handleAssignSeatsToZone"
        @update-stage="handleUpdateStage"
        @delete-stage="handleDeleteStage"
        @add-stage="handleAddStage"
        @update-zone="handleUpdateZone"
        @delete-zone="handleDeleteZone"
      />
    </template>

    <template #footer>
      <BottomStatusBar
        :statistics="bottomStatistics"
        :current-floor-name="currentFloor?.name"
        :zoom-level="zoomLevel"
        :hovered-seat-status-text="hoveredSeatStatusText"
        @show-shortcuts="shortcutsVisible = true"
      />
    </template>
  </SeatMapEditorLayout>

  <BatchGenerateModal
    :visible="batchVisible"
    :start-position="{ x: 0, y: 50 }"
    @ok="handleBatchOk"
    @cancel="handleBatchCancel"
  />

  <KeyboardShortcutsModal :visible="shortcutsVisible" @close="shortcutsVisible = false" />

  <FloorManagerModal
    :visible="floorManagerVisible"
    :floors="floors"
    @ok="handleFloorManagerOk"
    @cancel="floorManagerVisible = false"
  />

  <RenumberModal
    :visible="renumberModalVisible"
    :seats="selectedSeats"
    @ok="handleRenumberOk"
    @cancel="renumberModalVisible = false"
  />

  <SingleSeatModal
    v-if="editingSeat"
    :visible="singleSeatModalVisible"
    :seat="editingSeat"
    :zones="zones"
    :existing-seats="seats"
    @ok="handleSingleSeatOk"
    @cancel="
      () => {
        singleSeatModalVisible = false
        editingSeat = null
      }
    "
  />

  <ImportDataModal
    :visible="uiState.importVisible"
    @import="handleImportData"
    @close="() => (uiState.importVisible = false)"
  />

  <ZoneConfigModal
    :visible="zoneConfigModalVisible"
    :venue-id="(props.initialData as any)?.id || ''"
    :floor-id="activeFloorId"
    :existing-zones="zones.filter((z: Zone) => z.floorId === activeFloorId)"
    @ok="handleZoneConfigOk"
    @cancel="() => (zoneConfigModalVisible = false)"
  />

  <!-- 演出模式：票档配置弹窗 -->
  <a-modal
    v-model:open="priceTierModalVisible"
    :title="editingPriceTier ? '编辑票档' : '新建票档'"
    width="520"
    centered
    @ok="handlePriceTierModalOk"
    @cancel="handlePriceTierModalCancel"
  >
    <a-form layout="vertical">
      <a-form-item
        label="票档名称"
        name="name"
        :rules="[
          { required: true, message: '请输入票档名称' },
          { max: 20, message: '票档名称不能超过 20 个字' },
        ]"
        tooltip="例如：A 区、B 区、VIP"
      >
        <a-input
          v-model:value="priceTierForm.name"
          placeholder="请输入票档名称"
          :maxlength="20"
          show-count
        />
      </a-form-item>

      <a-form-item
        label="票价（元）"
        name="price"
        :rules="[{ required: true, message: '请输入票价' }]"
        tooltip="单张票面价格"
      >
        <a-input-number
          v-model:value="priceTierForm.price"
          :min="0"
          :precision="2"
          style="width: 100%"
          placeholder="请输入票价"
        />
      </a-form-item>

      <a-form-item
        label="票档颜色"
        name="color"
        tooltip="座位将在票档视图中显示为此颜色"
      >
        <a-space direction="vertical" style="width: 100%">
          <!-- 预设颜色块 -->
          <a-space wrap>
            <div
              v-for="color in PRICE_TIER_PRESET_COLORS"
              :key="color"
              :style="{
                width: '32px',
                height: '32px',
                backgroundColor: color,
                border: selectedPriceTierColor === color ? '3px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }"
              :title="color"
              @click="
                () => {
                  selectedPriceTierColor = color
                  priceTierForm.color = color
                }
              "
            />
          </a-space>

          <!-- 自定义颜色：左侧色块 + Hex 输入 + 提示文案 -->
          <a-space align="center">
            <a-input
              v-model:value="priceTierForm.color"
              style="width: 110px"
              size="small"
              placeholder="#FF6B6B"
            >
              <template #prefix>
                <span
                  :style="{
                    display: 'inline-block',
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    marginRight: '4px',
                    border: '1px solid #d9d9d9',
                    backgroundColor: selectedPriceTierColor,
                    position: 'relative',
                    overflow: 'hidden',
                  }"
                  @click="openPriceTierNativeColorPicker"
                >
                  <input
                    ref="priceTierColorInputRef"
                    type="color"
                    :value="selectedPriceTierColor"
                    style="
                      position: absolute;
                      top: 0;
                      left: 0;
                      width: 100%;
                      height: 100%;
                      opacity: 0;
                      cursor: pointer;
                      border: none;
                      padding: 0;
                      margin: 0;
                    "
                    @input="handlePriceTierNativeColorChange"
                  />
                </span>
              </template>
            </a-input>
            <a-typography-text type="secondary"> 或选择自定义颜色 </a-typography-text>
          </a-space>
        </a-space>
      </a-form-item>

      <a-form-item
        label="显示顺序"
        name="order"
        :rules="[
          { required: true, message: '请输入显示顺序' },
          { type: 'number', min: 1, message: '显示顺序必须大于 0' },
        ]"
        tooltip="数字越小越靠前，用于列表排序"
      >
        <a-input-number
          v-model:value="priceTierForm.order"
          placeholder="1"
          style="width: 100%"
          :min="1"
          :precision="0"
        />
      </a-form-item>

      <a-form-item label="备注">
        <a-textarea
          v-model:value="priceTierForm.remark"
          :rows="3"
          :maxlength="80"
          placeholder="可选：票档说明/包含的权益等"
        />
      </a-form-item>
    </a-form>

    <div
      style="
        margin-top: 16px;
        padding: 12px;
        background: #f0f5ff;
        border: 1px solid #adc6ff;
        border-radius: 4px;
      "
    >
      <a-typography-text type="secondary" style="font-size: 12px">
        提示：票档是演出级别的配置数据，继承自场馆座区配置。创建票档后，您可以在左侧面板中批量分配座位到该票档。
      </a-typography-text>
    </div>
  </a-modal>

  <a-modal
    v-model:open="exportModalVisible"
    title="导出座位图"
    :footer="null"
    :width="600"
    centered
    destroy-on-close
  >
    <ExportPanel
      :theater-data="theaterDataForExport"
      :canvas-ref="canvasElement"
      :current-floor-id="activeFloorId"
      :render-floor="renderFloorForExport"
    />
  </a-modal>
</template>

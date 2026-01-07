<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import message from 'ant-design-vue/es/message'
import Modal from 'ant-design-vue/es/modal'
import { type SessionConfig, type SessionPriceTier, type ShowFormSession } from './types'
import { fetchVenues, fetchVenueDetail } from '@/api/theaterVenue'
import type { VenueCapacityType, VenueListRequest, Venue } from '@/api/endpoints/theater/types'

type ExcludeDate = {
  date: string
  reason?: string
}

type AddSessionFormState = {
  venueId?: string
  customSessions: ShowFormSession[]
  periodicDateRange: [string, string] | []
  periodicWeekdays: number[]
  periodicTimes: string[]
  periodicDurationMinutes: number | null
  periodicExcludeDates: ExcludeDate[]
  priceTiers: SessionPriceTier[]
}

const props = defineProps<{
  visible: boolean
  initialValues?: SessionConfig
  existingConfigs?: SessionConfig[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'ok', value: SessionConfig): void
  (e: 'cancel'): void
}>()

const loadingVenues = ref(false)
const venueOptions = ref<
  Array<{ label: string; value: string; capacityType: VenueCapacityType; raw: Venue }>
>([])
const currentVenueCapacityType = ref<VenueCapacityType | undefined>(undefined)
const zoneOptions = ref<Array<{ label: string; value: string }>>([])
const venueDetail = ref<Venue | null>(null)

const periodicModalVisible = ref(false)
const initialSnapshot = ref<string | null>(null)

const formState = reactive<AddSessionFormState>({
  venueId: undefined,
  customSessions: [],
  periodicDateRange: [],
  periodicWeekdays: [5, 6],
  periodicTimes: [],
  periodicDurationMinutes: 90,
  periodicExcludeDates: [],
  priceTiers: [],
})

const internalVisible = computed(() => props.visible)

const buildSnapshot = () =>
  JSON.stringify({
    venueId: formState.venueId,
    customSessions: formState.customSessions,
    periodicDateRange: formState.periodicDateRange,
    periodicWeekdays: formState.periodicWeekdays,
    periodicTimes: formState.periodicTimes,
    periodicDurationMinutes: formState.periodicDurationMinutes,
    periodicExcludeDates: formState.periodicExcludeDates,
    priceTiers: formState.priceTiers,
  })

const buildPreciseSeatPriceTiers = (venue: Venue, previous?: SessionPriceTier[]) => {
  if (!venue || venue.capacityType !== 'precise_seat') return [] as SessionPriceTier[]

  const floors = (venue as any).floors || []
  const zones = (venue as any).zones || []
  const seats = (venue as any).seats || []

  const previousByZoneId = new Map<string, SessionPriceTier>()
  ;(previous || []).forEach((t: SessionPriceTier) => {
    const zoneId = (t as any).zoneId as string | undefined
    if (zoneId) previousByZoneId.set(zoneId, t)
  })

  const result: SessionPriceTier[] = zones.map((zone: any, index: number) => {
    const floor =
      floors.find((f: any) => f.id === zone.floorId) ||
      floors.find((f: any) => f.name === zone.floor) ||
      null

    const capacity = seats.filter(
      (s: any) => s.zoneId === zone.id && s.status === 'available',
    ).length

    const base: SessionPriceTier = {
      name: zone.name,
      price: 0,
      id: undefined,
      floorId: zone.floorId,
      floorName: floor?.name || zone.floor || '',
      zoneId: zone.id,
      capacity,
      order: zone.order ?? zone.sort ?? index,
    }

    const prev = previousByZoneId.get(zone.id)
    if (prev) {
      return {
        ...base,
        price: prev.price,
      }
    }

    return base
  })

  return result
}

const buildZoneCapacityPriceTiers = (venue: Venue) => {
  if (!venue || venue.capacityType !== 'zone_capacity') return [] as SessionPriceTier[]

  const zones = (venue as any).zones || []

  const result: SessionPriceTier[] = zones.map((zone: any, index: number) => ({
    name: zone.name,
    price: 0,
    id: undefined,
    color: zone.color || '#1890ff',
    remark: '',
    zoneId: zone.id,
    // 为兼容后端字段，仍保留 zoneIds
    zoneIds: [zone.id],
    capacity: 0,
    order: zone.order ?? zone.sort ?? index,
  }))

  return result
}

const loadVenues = async () => {
  try {
    loadingVenues.value = true
    const params: VenueListRequest = {
      page: 1,
      pageSize: 100,
      status: 'active',
    }
    const res = await fetchVenues(params)
    venueOptions.value = (res.list || []).map((v: any) => ({
      label: v.name,
      value: v.id,
      capacityType: v.capacityType as VenueCapacityType,
      raw: v as Venue,
    }))
  } catch (err) {
    console.error(err)
    message.error('获取场馆列表失败')
  } finally {
    loadingVenues.value = false
  }
}

const applyVenueDetailToPriceTiers = (venue: Venue) => {
  const newType = venue.capacityType as VenueCapacityType
  const isSameAsInitial = !!props.initialValues && props.initialValues.venueId === (venue as any).id

  currentVenueCapacityType.value = newType
  venueDetail.value = venue

  if (newType === 'zone_capacity' && (venue as any).zones) {
    zoneOptions.value = ((venue as any).zones || []).map((z: any) => ({
      label: z.name,
      value: z.id,
    }))
  } else {
    zoneOptions.value = []
  }

  // 从其它场馆切换时，清空票档，避免沿用上一场馆的配置
  if (!isSameAsInitial) {
    formState.priceTiers = []
  }

  if (newType === 'precise_seat') {
    formState.priceTiers = buildPreciseSeatPriceTiers(venue, formState.priceTiers)
  } else if (newType === 'zone_capacity') {
    // 新建或切换到按座区容量时，按场馆座区自动生成票档
    if (!formState.priceTiers.length) {
      formState.priceTiers = buildZoneCapacityPriceTiers(venue)
    }
  }
}

const loadVenueDetail = async (venueId?: string) => {
  if (!venueId) {
    currentVenueCapacityType.value = undefined
    zoneOptions.value = []
    venueDetail.value = null
    return
  }
  try {
    const detail = await fetchVenueDetail(venueId)
    applyVenueDetailToPriceTiers(detail)
  } catch (err) {
    console.error(err)
    message.error('获取场馆详情失败')
  }
}

const resetStateFromInitialValues = (config?: SessionConfig) => {
  if (!config) {
    formState.venueId = undefined
    formState.customSessions = [
      {
        date: '',
        startTime: '',
        durationMinutes: 90,
      },
    ]
    formState.periodicDateRange = []
    formState.periodicWeekdays = [5, 6]
    formState.periodicTimes = []
    formState.periodicDurationMinutes = 90
    formState.periodicExcludeDates = []
    formState.priceTiers = []
    currentVenueCapacityType.value = undefined
    zoneOptions.value = []
    venueDetail.value = null
    return
  }

  formState.venueId = config.venueId
  formState.customSessions = (config.sessions || []).map((s) => ({
    date: s.date,
    startTime: s.startTime,
    durationMinutes: s.durationMinutes,
  }))
  formState.periodicDateRange = []
  formState.periodicWeekdays = [5, 6]
  formState.periodicTimes = []
  formState.periodicDurationMinutes = (config.sessions && config.sessions[0]?.durationMinutes) || 90
  formState.periodicExcludeDates = []
  formState.priceTiers = (config.priceTiers || []).map((t: SessionPriceTier) => {
    const tier: any = { ...t }
    if (!tier.zoneId && tier.zoneIds && tier.zoneIds.length === 1) {
      tier.zoneId = tier.zoneIds[0]
    }
    return tier as SessionPriceTier
  })
}

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await loadVenues()
      resetStateFromInitialValues(props.initialValues)
      if (props.initialValues?.venueId) {
        await loadVenueDetail(props.initialValues.venueId)
      } else if (formState.venueId) {
        await loadVenueDetail(formState.venueId)
      }
      initialSnapshot.value = buildSnapshot()
    } else {
      initialSnapshot.value = null
    }
  },
)

watch(
  () => formState.venueId,
  (id) => {
    loadVenueDetail(id)
  },
)

watch(
  () => currentVenueCapacityType.value,
  (type) => {
    if (!type) return
    // 自由座席（小剧场）新建时默认生成一个“标准票”
    if (!props.initialValues && type === 'free_seating' && !formState.priceTiers.length) {
      formState.priceTiers.push({
        name: '标准票',
        price: 0,
        color: '#1890ff',
        remark: '',
        // 自由座席按总容量分配库存，这里先置 0，由用户填写
        capacity: 0,
      } as SessionPriceTier)
    }
  },
)

onMounted(() => {
  if (props.visible) {
    loadVenues()
  }
})

const handleAddCustomSession = () => {
  formState.customSessions.push({
    date: '',
    startTime: '',
    durationMinutes: formState.periodicDurationMinutes || 90,
  })
}

const handleRemoveCustomSession = (index: number) => {
  if (formState.customSessions.length <= 1) {
    message.warning('至少需要保留 1 个场次时间')
    return
  }
  formState.customSessions.splice(index, 1)
}

const handleAddPriceTier = () => {
  if (!formState.venueId) {
    message.error('请先选择场馆')
    return
  }

  const capacityType = currentVenueCapacityType.value

  const base: SessionPriceTier = {
    name: capacityType === 'free_seating' && !formState.priceTiers.length ? '标准票' : '',
    price: 0,
  }

  if (capacityType === 'free_seating') {
    ;(base as any).capacity = 0
  }

  formState.priceTiers.push(base)
}

const handleRemovePriceTier = (index: number) => {
  formState.priceTiers.splice(index, 1)
}

const handleAddPeriodicTime = () => {
  formState.periodicTimes.push('19:30')
}

const handleRemovePeriodicTime = (index: number) => {
  formState.periodicTimes.splice(index, 1)
}

const handleAddExcludeDate = () => {
  formState.periodicExcludeDates.push({ date: '', reason: '' })
}

const handleRemoveExcludeDate = (index: number) => {
  formState.periodicExcludeDates.splice(index, 1)
}

const handlePeriodicDateChange = (value: [string, string] | null) => {
  if (!value || value.length !== 2) {
    formState.periodicDateRange = []
    return
  }
  const [start, end] = value
  const startDay = dayjs(start)
  const endDay = dayjs(end)
  if (endDay.diff(startDay, 'day') > 365) {
    message.error('日期范围不能超过一年')
    formState.periodicDateRange = []
    return
  }
  formState.periodicDateRange = value
}

const handleOpenPeriodicModal = () => {
  periodicModalVisible.value = true
}

const computeSessionsFromPeriodic = (): ShowFormSession[] => {
  if (
    !formState.periodicDateRange ||
    formState.periodicDateRange.length !== 2 ||
    !formState.periodicTimes.length ||
    !formState.periodicDurationMinutes ||
    formState.periodicDurationMinutes <= 0
  ) {
    return []
  }

  const [start, end] = formState.periodicDateRange
  let current = dayjs(start)
  const endDate = dayjs(end)
  const result: ShowFormSession[] = []
  const excludeDates = (formState.periodicExcludeDates || []).map((ex: ExcludeDate) =>
    ex.date ? dayjs(ex.date).format('YYYY-MM-DD') : '',
  )

  while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
    const weekday = current.day()
    const currentDateStr = current.format('YYYY-MM-DD')
    const isExcluded = excludeDates.length > 0 && excludeDates.includes(currentDateStr)

    if (
      (!formState.periodicWeekdays.length || formState.periodicWeekdays.includes(weekday)) &&
      !isExcluded
    ) {
      formState.periodicTimes.forEach((time: string) => {
        result.push({
          date: currentDateStr,
          startTime: time,
          durationMinutes: formState.periodicDurationMinutes || 90,
        })
      })
    }
    current = current.add(1, 'day')
  }

  return result
}

const hasTimeConflict = (sessions: ShowFormSession[]): boolean => {
  const map = new Set<string>()

  ;(props.existingConfigs || []).forEach((config: SessionConfig) => {
    ;(config.sessions || []).forEach((s: ShowFormSession) => {
      map.add(`${config.venueId}_${s.date}_${s.startTime}`)
    })
  })

  formState.customSessions.forEach((s: ShowFormSession) => {
    if (s.date && s.startTime) {
      map.add(`${formState.venueId || ''}_${s.date}_${s.startTime}`)
    }
  })

  return sessions.some((s: ShowFormSession) =>
    map.has(`${formState.venueId || ''}_${s.date}_${s.startTime}`),
  )
}

const hasInternalOverlap = (sessions: ShowFormSession[]): boolean => {
  if (!sessions.length) return false

  const byDate: Record<string, Array<{ start: number; end: number }>> = {}

  sessions.forEach((s: ShowFormSession) => {
    if (!s.date || !s.startTime || !s.durationMinutes || s.durationMinutes <= 0) return
    const [hStr, mStr] = s.startTime.split(':')
    const h = Number(hStr)
    const m = Number(mStr)
    if (Number.isNaN(h) || Number.isNaN(m)) return
    const start = h * 60 + m
    const end = start + s.durationMinutes
    const key = s.date
    if (!byDate[key]) byDate[key] = []
    byDate[key].push({ start, end })
  })

  return Object.values(byDate).some((list: Array<{ start: number; end: number }>) => {
    if (list.length <= 1) return false
    const sorted = list.sort(
      (a: { start: number; end: number }, b: { start: number; end: number }) => a.start - b.start,
    )
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1]
      const curr = sorted[i]
      if (!prev || !curr) continue
      if (curr.start < prev.end) {
        return true
      }
    }
    return false
  })
}

const handlePeriodicOk = () => {
  const sessions = computeSessionsFromPeriodic()
  if (!sessions.length) {
    message.error('请先完整填写批量场次配置')
    return
  }
  if (hasTimeConflict(sessions)) {
    message.error('批量生成的场次与已有场次配置存在时间冲突，请调整后再生成')
    return
  }
  formState.customSessions.push(
    ...sessions.map((s) => ({
      date: s.date,
      startTime: s.startTime,
      durationMinutes: s.durationMinutes,
    })),
  )
  periodicModalVisible.value = false
}

const handlePeriodicCancel = () => {
  periodicModalVisible.value = false
}

const periodicGeneratedCount = computed<number>(() => {
  const sessions = computeSessionsFromPeriodic()
  return sessions.length
})

const totalFreeSeatingCapacity = computed<number>(() => {
  if (currentVenueCapacityType.value !== 'free_seating') return 0
  return (formState.priceTiers || []).reduce(
    (sum: number, tier: SessionPriceTier) => sum + (tier.capacity || 0),
    0,
  )
})

const freeSeatingVenueCapacity = computed<number>(() => {
  if (currentVenueCapacityType.value !== 'free_seating' || !venueDetail.value) return 0
  return (venueDetail.value as any).totalCapacity || 0
})

const isFreeSeatingOverCapacity = computed(
  () =>
    currentVenueCapacityType.value === 'free_seating' &&
    freeSeatingVenueCapacity.value > 0 &&
    totalFreeSeatingCapacity.value > freeSeatingVenueCapacity.value,
)

const zoneMapById = computed<Map<string, any>>(() => {
  const map = new Map<string, any>()
  if (!venueDetail.value) return map
  const zones: any[] = (venueDetail.value as any).zones || []
  zones.forEach((z: any) => {
    if (z && z.id) {
      map.set(z.id, z)
    }
  })
  return map
})

const zoneCapacityStats = computed<{ totalCurrent: number; totalZone: number }>(() => {
  if (currentVenueCapacityType.value !== 'zone_capacity') {
    return { totalCurrent: 0, totalZone: 0 }
  }
  let totalCurrent = 0
  let totalZone = 0
  const map = zoneMapById.value

  ;(formState.priceTiers || []).forEach((tier: any) => {
    const capacity = tier.capacity || 0
    const zoneId = tier.zoneId || (tier.zoneIds && tier.zoneIds[0])
    const zone = zoneId ? map.get(zoneId) : undefined
    const zoneCapacity = zone?.capacity || 0
    totalCurrent += capacity
    totalZone += zoneCapacity
  })

  return { totalCurrent, totalZone }
})

const isZoneCapacityOverTotal = computed(
  () =>
    currentVenueCapacityType.value === 'zone_capacity' &&
    zoneCapacityStats.value.totalZone > 0 &&
    zoneCapacityStats.value.totalCurrent > zoneCapacityStats.value.totalZone,
)

const getZoneInfoForTier = (tier: any) => {
  if (!tier) return null
  const zoneId = tier.zoneId || (tier.zoneIds && tier.zoneIds[0])
  if (!zoneId) return null
  const map = zoneMapById.value
  return map.get(zoneId) || null
}

const isTierOverZoneCapacity = (tier: any) => {
  const zone = getZoneInfoForTier(tier)
  if (!zone) return false
  const capacity = tier.capacity || 0
  const limit = zone.capacity || 0
  return limit > 0 && capacity > limit
}

const hasUnsavedChanges = () => {
  if (!initialSnapshot.value) return false
  try {
    return initialSnapshot.value !== buildSnapshot()
  } catch {
    return true
  }
}

const handleOkWithOverlapCheck = () => {
  const sessions = formState.customSessions.filter(
    (s: ShowFormSession) => s.date && s.startTime && s.durationMinutes,
  )

  if (!sessions.length) {
    message.error('请至少添加一个场次时间')
    return
  }

  if (hasInternalOverlap(sessions)) {
    message.error('同一天内的场次时间存在重叠，请调整后再保存')
    return
  }

  handleOk()
}

const handleOk = () => {
  if (!formState.venueId) {
    message.error('请先选择场馆')
    return
  }

  const sessions = formState.customSessions.filter(
    (s: ShowFormSession) => s.date && s.startTime && s.durationMinutes,
  )

  if (!sessions.length) {
    message.error('请至少添加一个场次时间')
    return
  }

  if (hasTimeConflict([])) {
    // 这里只检查与其他配置冲突的已有场次，新增场次已在对应操作中检查
    message.error('场次时间与已有场次配置存在冲突，请调整后再保存')
    return
  }

  if (!formState.priceTiers.length) {
    message.error('请至少添加一个票档')
    return
  }

  const hasInvalidTier = formState.priceTiers.some(
    (t: SessionPriceTier) => !t.name || t.price === undefined || t.price <= 0,
  )
  if (hasInvalidTier) {
    message.error('请完整填写所有票档信息，并设置有效价格')
    return
  }

  const venue = venueOptions.value.find(
    (v: { label: string; value: string; capacityType: VenueCapacityType }) =>
      v.value === formState.venueId,
  )

  const config: SessionConfig = {
    venueId: formState.venueId!,
    venueName: venue?.label,
    venueCapacityType: venue?.capacityType,
    priceTiers: formState.priceTiers.map((t: SessionPriceTier) => ({
      ...t,
      name: t.name.trim(),
      remark: t.remark?.trim() || undefined,
    })),
    sessions: sessions.map((s: ShowFormSession) => ({
      date: s.date,
      startTime: s.startTime,
      durationMinutes: s.durationMinutes,
    })),
  }

  emit('ok', config)
  emit('update:visible', false)
}

const handleCancel = () => {
  if (hasUnsavedChanges()) {
    Modal.confirm({
      title: '确认关闭？',
      content: '有未保存的场次配置修改，关闭后将不保存。',
      okText: '确认关闭',
      cancelText: '继续编辑',
      onOk() {
        emit('update:visible', false)
        emit('cancel')
      },
    })
  } else {
    emit('update:visible', false)
    emit('cancel')
  }
}
</script>

<template>
  <a-modal
    :open="internalVisible"
    title="添加场次配置"
    width="900px"
    :destroy-on-close="true"
    wrap-class-name="add-session-modal"
    @ok="handleOkWithOverlapCheck"
    @cancel="handleCancel"
  >
    <a-spin :spinning="loadingVenues">
      <a-form layout="vertical">
        <!-- 场馆选择 -->
        <a-form-item label="场馆名称" required>
          <a-select
            v-model:value="formState.venueId"
            placeholder="请选择"
            :options="venueOptions"
            show-search
            :filter-option="
              (input: string, option: any) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            "
          />
        </a-form-item>

        <!-- 票档配置 -->
        <a-form-item label="票档配置" required>
          <a-space direction="vertical" class="ticket-space-vertical">
            <a-alert
              type="info"
              show-icon
              v-if="!formState.venueId"
              class="ticket-venue-alert"
              :message="'请先选择场馆'"
            />

            <div class="ticket-header-row">
              <span v-if="currentVenueCapacityType === 'precise_seat'" class="ticket-header-text">
                已配置 {{ formState.priceTiers.length }} 个票档
              </span>
              <div class="ticket-header-actions">
                <a-button
                  v-if="currentVenueCapacityType === 'free_seating'"
                  type="dashed"
                  :disabled="!formState.venueId"
                  @click="handleAddPriceTier"
                >
                  添加票档
                </a-button>
              </div>
            </div>

            <!-- 精确座位：票档由场馆座区生成，只编辑票价 -->
            <a-table
              v-if="currentVenueCapacityType === 'precise_seat' && formState.priceTiers.length"
              :data-source="formState.priceTiers"
              :pagination="false"
              :row-key="(_: SessionPriceTier, index: number) => String(index)"
            >
              <a-table-column key="name" :width="'30%'">
                <template #title>票档名称</template>
                <template #default="{ index }">
                  <span>{{ formState.priceTiers[index].name }}</span>
                </template>
              </a-table-column>

              <a-table-column key="floorName" :width="'20%'">
                <template #title>楼层</template>
                <template #default="{ index }">
                  <span>{{ (formState.priceTiers[index] as any).floorName || '-' }}</span>
                </template>
              </a-table-column>

              <a-table-column key="price" :width="'25%'">
                <template #title>
                  <span class="required-asterisk">*</span>
                  <span class="required-label-margin">票价（元）</span>
                </template>
                <template #default="{ index }">
                  <a-input-number
                    v-model:value="formState.priceTiers[index].price"
                    :min="0"
                    :max="999999"
                    :precision="2"
                    placeholder="票价"
                    class="full-width-input"
                  />
                </template>
              </a-table-column>

              <a-table-column key="capacity" :width="'25%'">
                <template #title>库存(可售座位)</template>
                <template #default="{ index }">
                  <span>{{ (formState.priceTiers[index] as any).capacity ?? '-' }}</span>
                </template>
              </a-table-column>
            </a-table>

            <!-- 其他容量模式：通用票档编辑表 -->
            <a-table
              v-else-if="formState.priceTiers.length"
              :data-source="formState.priceTiers"
              :pagination="false"
              :row-key="(_: SessionPriceTier, index: number) => String(index)"
            >
              <a-table-column key="name" :width="'25%'">
                <template #title>
                  <span class="required-asterisk">*</span>
                  <span class="required-label-margin">票档名称</span>
                </template>
                <template #default="{ index }">
                  <a-input
                    v-model:value="formState.priceTiers[index].name"
                    placeholder="请输入票档名称"
                    :maxlength="20"
                  />
                </template>
              </a-table-column>

              <a-table-column key="price" :width="'20%'">
                <template #title>
                  <span class="required-asterisk">*</span>
                  <span class="required-label-margin">票面价（元）</span>
                </template>
                <template #default="{ index }">
                  <a-input-number
                    v-model:value="formState.priceTiers[index].price"
                    :min="0"
                    :max="999999"
                    :precision="2"
                    placeholder="价格"
                    class="full-width-input"
                  />
                </template>
              </a-table-column>

              <a-table-column
                v-if="currentVenueCapacityType === 'free_seating'"
                key="capacity"
                :width="'20%'"
              >
                <template #title>
                  <span>
                    库存<span class="required-asterisk">*</span>
                    <a-typography-text
                      v-if="venueDetail && (venueDetail as any).totalCapacity"
                      :type="isFreeSeatingOverCapacity ? 'danger' : 'secondary'"
                      class="capacity-hint-text"
                    >
                      ({{ totalFreeSeatingCapacity }}/{{ (venueDetail as any).totalCapacity || 0 }})
                    </a-typography-text>
                  </span>
                </template>
                <template #default="{ index }">
                  <a-input-number
                    v-model:value="(formState.priceTiers[index] as any).capacity"
                    :min="1"
                    :max="999999"
                    class="full-width-input"
                    placeholder="库存"
                  />
                </template>
              </a-table-column>

              <a-table-column
                v-if="currentVenueCapacityType === 'zone_capacity'"
                key="zoneCapacity"
                :width="'20%'"
              >
                <template #title>
                  <span>
                    库存<span class="required-asterisk">*</span>
                    <a-typography-text
                      v-if="zoneCapacityStats.totalZone"
                      :type="isZoneCapacityOverTotal ? 'danger' : 'secondary'"
                      class="capacity-hint-text"
                    >
                      ({{ zoneCapacityStats.totalCurrent }}/{{ zoneCapacityStats.totalZone }})
                    </a-typography-text>
                  </span>
                </template>
                <template #default="{ index }">
                  <a-input-number
                    v-model:value="(formState.priceTiers[index] as any).capacity"
                    :min="1"
                    :max="999999"
                    class="full-width-input"
                    placeholder="库存"
                    :status="
                      isTierOverZoneCapacity(formState.priceTiers[index] as any)
                        ? 'error'
                        : undefined
                    "
                  />
                </template>
              </a-table-column>

              <a-table-column
                v-if="currentVenueCapacityType === 'zone_capacity'"
                key="zoneName"
                :width="'20%'"
              >
                <template #title>关联座区</template>
                <template #default="{ index }">
                  <span>
                    {{ getZoneInfoForTier(formState.priceTiers[index] as any)?.name || '-' }}
                  </span>
                </template>
              </a-table-column>

              <a-table-column
                key="actions"
                :width="80"
                align="right"
                v-if="currentVenueCapacityType !== 'zone_capacity'"
              >
                <template #title>操作</template>
                <template #default="{ index }">
                  <a-popconfirm
                    title="确认删除该票档吗？"
                    ok-text="确认"
                    cancel-text="取消"
                    @confirm="() => handleRemovePriceTier(index)"
                  >
                    <a-button type="link" size="small">删除</a-button>
                  </a-popconfirm>
                </template>
              </a-table-column>
            </a-table>
          </a-space>
        </a-form-item>

        <!-- 场次时间配置 -->
        <a-form-item label="场次时间配置" required class="session-time-form-item">
          <div class="session-time-actions">
            <a-button @click="handleAddCustomSession">添加场次</a-button>
            <a-button @click="handleOpenPeriodicModal">批量添加场次</a-button>
          </div>

          <a-table
            :data-source="formState.customSessions"
            :pagination="false"
            :row-key="(_: ShowFormSession, index: number) => String(index)"
          >
            <a-table-column key="date" :width="'28%'">
              <template #title>演出日期</template>
              <template #default="{ index }">
                <a-date-picker
                  v-model:value="formState.customSessions[index].date"
                  value-format="YYYY-MM-DD"
                  class="full-width-input"
                  placeholder="选择日期"
                />
              </template>
            </a-table-column>

            <a-table-column key="startTime" :width="'24%'">
              <template #title>开演时间</template>
              <template #default="{ index }">
                <a-time-picker
                  v-model:value="formState.customSessions[index].startTime"
                  value-format="HH:mm"
                  format="HH:mm"
                  class="full-width-input"
                  placeholder="选择时间"
                />
              </template>
            </a-table-column>

            <a-table-column key="durationMinutes" :width="'24%'">
              <template #title>时长（分钟）</template>
              <template #default="{ index }">
                <a-input-number
                  v-model:value="formState.customSessions[index].durationMinutes"
                  :min="1"
                  :max="1440"
                  class="full-width-input"
                  placeholder="时长"
                />
              </template>
            </a-table-column>

            <a-table-column key="actions" :width="'8%'" align="right">
              <template #title>操作</template>
              <template #default="{ index }">
                <a-button
                  v-if="formState.customSessions.length == 1"
                  type="link"
                  size="small"
                  disabled
                  >删除</a-button
                >
                <a-popconfirm
                  v-else
                  title="确认删除该场次吗？"
                  ok-text="确认"
                  cancel-text="取消"
                  @confirm="() => handleRemoveCustomSession(index)"
                >
                  <a-button type="link" size="small">删除</a-button>
                </a-popconfirm>
              </template>
            </a-table-column>
          </a-table>
        </a-form-item>
      </a-form>
    </a-spin>

    <!-- 批量添加场次弹窗 -->
    <a-modal
      :open="periodicModalVisible"
      title="批量添加场次"
      width="600px"
      :destroy-on-close="true"
      @ok="handlePeriodicOk"
      @cancel="handlePeriodicCancel"
    >
      <a-form layout="vertical">
        <a-form-item label="日期范围" required>
          <a-range-picker
            :value="formState.periodicDateRange"
            value-format="YYYY-MM-DD"
            class="full-width-input"
            placeholder="选择开始和结束日期"
            @change="handlePeriodicDateChange"
          />
        </a-form-item>

        <a-form-item label="每日开演时间" required>
          <div class="periodic-time-list">
            <div
              v-for="(time, index) in formState.periodicTimes"
              :key="index"
              class="periodic-time-item"
            >
              <a-time-picker
                v-model:value="formState.periodicTimes[index]"
                value-format="HH:mm"
                format="HH:mm"
                class="periodic-time-picker"
              />
              <a-button type="link" size="small" @click="handleRemovePeriodicTime(index)">
                删除
              </a-button>
            </div>
            <a-button type="dashed" class="periodic-time-picker" @click="handleAddPeriodicTime">
              添加时间
            </a-button>
          </div>
        </a-form-item>

        <a-form-item label="演出时长（分钟）" required>
          <a-input-number
            v-model:value="formState.periodicDurationMinutes"
            :min="1"
            :max="1440"
            class="periodic-time-picker"
            placeholder="演出时长"
          />
        </a-form-item>

        <a-form-item label="星期限制">
          <a-checkbox-group v-model:value="formState.periodicWeekdays">
            <a-checkbox :value="1">周一</a-checkbox>
            <a-checkbox :value="2">周二</a-checkbox>
            <a-checkbox :value="3">周三</a-checkbox>
            <a-checkbox :value="4">周四</a-checkbox>
            <a-checkbox :value="5">周五</a-checkbox>
            <a-checkbox :value="6">周六</a-checkbox>
            <a-checkbox :value="0">周日</a-checkbox>
          </a-checkbox-group>
        </a-form-item>

        <a-form-item label="排除日期">
          <div class="exclude-date-list">
            <div
              v-for="(item, index) in formState.periodicExcludeDates || []"
              :key="index"
              class="exclude-date-item"
            >
              <a-date-picker
                v-model:value="item.date"
                value-format="YYYY-MM-DD"
                format="YYYY-MM-DD"
                placeholder="休演日期"
                class="exclude-date-picker"
              />
              <a-input
                v-model:value="item.reason"
                placeholder="原因（可选）"
                class="exclude-date-reason"
              />
              <a-button type="link" danger size="small" @click="handleRemoveExcludeDate(index)">
                删除
              </a-button>
            </div>
            <a-button type="dashed" size="small" @click="handleAddExcludeDate">
              添加休演日
            </a-button>
          </div>
        </a-form-item>

        <a-alert type="info" show-icon :message="`预计生成：${periodicGeneratedCount} 个场次`" />
      </a-form>
    </a-modal>
  </a-modal>
</template>

<style scoped>
/* 空状态样式对齐 a 项目：中间占位图 + 提示文案，外围浅灰边框和背景 */
.ant-empty {
  margin: 24px 0;
}

.ant-empty:not(.ant-empty-normal) {
  /* 保守处理，只针对本组件内默认 Empty 做容器背景 */
}

/* 包裹 a-empty 的区域在 a 项中有浅灰背景和边框，这里直接复用到组件根容器内的空状态 */
.ant-empty {
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 40px 0;
  background-color: #fafafa;
}

.ticket-space-vertical {
  width: 100%;
}

.ticket-venue-alert {
  margin-bottom: 12px;
}

.ticket-header-row {
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ticket-header-text {
  color: rgba(0, 0, 0, 0.45);
}

.ticket-header-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.required-asterisk {
  color: #ff4d4f;
}

.required-label-margin {
  margin-left: 4px;
}

.full-width-input {
  width: 100%;
}

.capacity-hint-text {
  font-size: 12px;
  margin-left: 4px;
}

.session-time-form-item {
  position: relative;
}

.session-time-actions {
  margin-bottom: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  position: absolute;
  right: 0;
  top: -34px;
}

.periodic-time-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.periodic-time-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.periodic-time-picker {
  width: 160px;
}

.exclude-date-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exclude-date-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.exclude-date-picker {
  width: 150px;
}

.exclude-date-reason {
  width: 200px;
}

:global(.add-session-modal .ant-modal-body) {
  max-height: 70vh;
  overflow-y: auto;
}
</style>

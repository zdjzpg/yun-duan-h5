<script setup lang="ts">
import { computed, ref } from 'vue'
import message from 'ant-design-vue/es/message'
import TheaterCanvasSimplified from '@/components/theater/seat-map-editor/canvas/TheaterCanvasSimplified.vue'
import type { Seat, Zone } from '@/components/theater/seat-map-editor/types.simplified'
import type { ShowPriceTier } from '@/types/theater'
import type { ShowSeatPrice, PriceTierStats } from '@/api/endpoints/show/types'

const props = defineProps<{
  showId: string
  seats: Seat[]
  zones: Zone[]
  priceTiers: ShowPriceTier[]
  seatPriceMapping: ShowSeatPrice[]
  stats?: PriceTierStats[]
}>()

const emit = defineEmits<{
  (e: 'batchAssign', priceTierId: string, seatIds: string[]): void
  (e: 'assignByZone', priceTierId: string, zoneId: string): void
}>()

const selectedSeatIds = ref<string[]>([])
const selectedTierId = ref<string | undefined>(undefined)

// 将映射结果挂载到座位数据上，带出票档颜色
const seatsWithPriceTier = computed<Seat[]>(() =>
  props.seats.map((seat: Seat) => {
    const mapping = props.seatPriceMapping.find(
      (m: ShowSeatPrice) => m.seatId === seat.id,
    )
    if (!mapping) return seat

    const tier = props.priceTiers.find(
      (t: ShowPriceTier) => t.id === mapping.priceTierId,
    )
    if (!tier) return seat

    return {
      ...seat,
      priceTierId: tier.id,
      priceTierColor: tier.color || '#f0f0f0',
    }
  }),
)

const totalSeats = computed(() => props.seats.length)
const assignedSeats = computed(() => props.seatPriceMapping.length)
const unassignedSeats = computed(() => totalSeats.value - assignedSeats.value)
const completionRate = computed(() => {
  if (!totalSeats.value) return 0
  return Number(((assignedSeats.value / totalSeats.value) * 100).toFixed(1))
})

const statsMap = computed<Record<string, PriceTierStats>>(() => {
  const map: Record<string, PriceTierStats> = {}
  if (props.stats) {
    props.stats.forEach((s: PriceTierStats) => {
      map[s.priceTierId] = s
    })
  }
  return map
})

const zoneSeatCountMap = computed<Record<string, number>>(() => {
  const map: Record<string, number> = {}
  props.seats.forEach((s: Seat) => {
    if (s.zoneId) {
      map[s.zoneId] = (map[s.zoneId] || 0) + 1
    }
  })
  return map
})

const handleBatchAssign = () => {
  if (!selectedTierId.value) {
    message.warning('请先选择票档')
    return
  }

  if (!selectedSeatIds.value.length) {
    message.warning('请先选择座位')
    return
  }

  emit('batchAssign', selectedTierId.value, [...selectedSeatIds.value])
  message.success(`已分配 ${selectedSeatIds.value.length} 个座位`)
  selectedSeatIds.value = []
}

const handleAssignByZone = (zoneId: string) => {
  if (!selectedTierId.value) {
    message.warning('请先选择票档')
    return
  }

  const zone = props.zones.find((z: Zone) => z.id === zoneId)
  if (!zone) return

  const seatsInZone = props.seats.filter((s: Seat) => s.zoneId === zoneId)
  if (!seatsInZone.length) {
    message.warning(`座区 ${zone.name} 没有座位`)
    return
  }

  emit('assignByZone', selectedTierId.value, zoneId)
}

const handleSeatSelect = (ids: string[]) => {
  selectedSeatIds.value = ids
}
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100%; gap: 16px">
    <a-card>
      <a-space direction="vertical" :size="16" style="width: 100%">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-statistic title="总座位数" :value="totalSeats" />
          </a-col>
          <a-col :span="6">
            <a-statistic
              title="已分配"
              :value="assignedSeats"
              :value-style="{ color: '#52c41a' }"
            />
          </a-col>
          <a-col :span="6">
            <a-statistic
              title="未分配"
              :value="unassignedSeats"
              :value-style="{ color: unassignedSeats > 0 ? '#faad14' : '#8c8c8c' }"
            />
          </a-col>
          <a-col :span="6">
            <a-statistic title="完成度" :value="completionRate" suffix="%" />
          </a-col>
        </a-row>

        <a-space :size="12" wrap>
          <span>选择票档：</span>
          <a-select
            v-model:value="selectedTierId"
            placeholder="请选择票档"
            style="width: 220px"
          >
            <a-select-option v-for="tier in priceTiers" :key="tier.id" :value="tier.id">
              <a-space :size="8">
                <div
                  :style="{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    backgroundColor: tier.color || '#f0f0f0',
                  }"
                />
                <span>{{ tier.name }}</span>
                <span style="color: #8c8c8c">
                  ¥{{ (tier.price / 100).toFixed(2) }}
                </span>
              </a-space>
            </a-select-option>
          </a-select>

          <a-button
            type="primary"
            :disabled="!selectedTierId || !selectedSeatIds.length"
            @click="handleBatchAssign"
          >
            分配选中座位 ({{ selectedSeatIds.length }})
          </a-button>

          <span style="margin-left: 16px">快捷分配：</span>
          <a-select
            placeholder="按座区分配"
            style="width: 220px"
            :value="undefined"
            :disabled="!selectedTierId"
            @change="handleAssignByZone"
          >
            <a-select-option v-for="zone in zones" :key="zone.id" :value="zone.id">
              {{ zone.name }} ({{ zoneSeatCountMap[zone.id] || 0 }}座)
            </a-select-option>
          </a-select>
        </a-space>
      </a-space>
    </a-card>

    <a-card style="flex: 1; overflow: hidden">
      <div
        style="
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        "
      >
        <TheaterCanvasSimplified
          :seats="seatsWithPriceTier"
          :selected-seat-ids="selectedSeatIds"
          :selected-element="null"
          :width="1200"
          :height="700"
          :show-grid="true"
          :enable-snap="false"
          :show-seat-labels="true"
          :viewport="{
            offsetX: 600,
            offsetY: 350,
            scale: 1,
          }"
          @seat-select="handleSeatSelect"
        />
      </div>
    </a-card>

    <a-card>
      <a-space :size="16" wrap>
        <span style="font-weight: 500">图例：</span>
        <template v-for="tier in priceTiers" :key="tier.id">
          <a-space :size="8">
            <div
              :style="{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                backgroundColor: tier.color || '#f0f0f0',
              }"
            />
            <span>{{ tier.name }}</span>
            <span style="color: #8c8c8c">
              ({{ statsMap[tier.id]?.assignedCount ?? 0 }}座)
            </span>
          </a-space>
        </template>
        <a-space :size="8">
          <div
            style="
              width: 16px;
              height: 16px;
              border-radius: 4px;
              background: #ffffff;
              border: 1px solid #d9d9d9;
            "
          />
          <span>未分配</span>
          <span style="color: #8c8c8c">({{ unassignedSeats }}座)</span>
        </a-space>
      </a-space>
    </a-card>
  </div>
</template>


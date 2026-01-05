<script setup lang="ts">
import { computed, ref } from 'vue'
import { PlusCircleOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import type { Floor, Seat, PriceTier } from '../types.simplified'
import { ZONE_SEARCH_THRESHOLD } from '../utils/constants'

const props = defineProps<{
  floors: Floor[]
  activeFloorId: string
  seats: Seat[]
  priceTiers: PriceTier[]
  selectedSeatIds: string[]
}>()

const emit = defineEmits<{
  (e: 'floorChange', floorId: string): void
  (e: 'editPriceTier', tier: PriceTier): void
  (e: 'deletePriceTier', tierId: string): void
  (e: 'assignSeatsToPriceTier', tierId: string): void
}>()

const currentFloor = computed(() => props.floors.find((f: Floor) => f.id === props.activeFloorId))

const currentFloorSeatCount = computed(
  () => props.seats.filter((s: Seat) => s.floorId === props.activeFloorId).length,
)

const currentFloorPriceTiers = computed(() =>
  props.priceTiers.filter((pt: PriceTier) => !pt.floorId || pt.floorId === props.activeFloorId),
)

const getFloorPriceTierCount = computed(() => currentFloorPriceTiers.value.length)

const getPriceTierSeatCount = (priceTierId: string): number =>
  props.seats.filter(
    (s: Seat) => s.floorId === props.activeFloorId && s.priceTierId === priceTierId,
  ).length

const searchText = ref('')
const showSearch = computed(() => currentFloorPriceTiers.value.length >= ZONE_SEARCH_THRESHOLD)

const filteredPriceTiers = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  return [...currentFloorPriceTiers.value]
    .sort((a: PriceTier, b: PriceTier) => (a.order || 0) - (b.order || 0))
    .filter((pt: PriceTier) => (!keyword ? true : pt.name.toLowerCase().includes(keyword)))
})

const handleFloorClick = (floorId: string) => {
  emit('floorChange', floorId)
}

const handleAssignSeats = (priceTierId: string) => {
  if (!props.selectedSeatIds.length) return
  emit('assignSeatsToPriceTier', priceTierId)
}
</script>

<template>
  <div class="seat-map-editor-panel-content">
    <!-- 楼层列表 -->
    <div>
      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        "
      >
        <a-typography-title :level="5" style="margin: 0"> 楼层 </a-typography-title>
      </div>

      <a-space direction="vertical" style="width: 100%" :size="4">
        <div
          v-for="floor in floors"
          :key="floor.id"
          @click="handleFloorClick(floor.id)"
          :style="{
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            background: floor.id === activeFloorId ? '#e6f7ff' : 'transparent',
            border: floor.id === activeFloorId ? '1px solid #91d5ff' : '1px solid transparent',
            transition: 'all 0.2s',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }"
        >
          <span
            :strong="floor.id === activeFloorId"
            :style="{
              color: floor.id === activeFloorId ? '#1890ff' : '#262626',
            }"
          >
            {{ floor.name }}
          </span>
          <span
            type="secondary"
            style="font-size: 12px"
            :style="{
              color: floor.id === activeFloorId ? '#1890ff' : '#8c8c8c',
            }"
          >
            {{ seats.filter((seat: Seat) => seat.floorId === floor.id).length }}
          </span>
        </div>
      </a-space>

      <span v-if="floors.length === 0" type="secondary" style="font-size: 12px"> 暂无楼层 </span>
    </div>

    <!-- 当前楼层概览 -->
    <a-card
      v-if="currentFloor"
      size="small"
      style="margin-top: 16px; background: #fafafa; border: 1px solid #f0f0f0"
    >
      <div style="margin-bottom: 8px">
        <a-typography-title strong style="font-size: 13px"> 当前楼层 </a-typography-title>
      </div>
      <a-space direction="vertical" style="width: 100%" :size="8">
        <div>
          <span type="secondary" style="font-size: 12px"> 名称：</span>
          <span strong style="font-size: 12px">
            {{ currentFloor.name }}
          </span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px">
          <a-statistic
            title="座位"
            :value="currentFloorSeatCount"
            :value-style="{ fontSize: '20px', color: '#1890ff' }"
          />
          <a-statistic
            title="票档"
            :value="getFloorPriceTierCount"
            :value-style="{ fontSize: '20px', color: '#52c41a' }"
          />
        </div>
      </a-space>
    </a-card>

    <!-- 票档配置 -->
    <div style="margin-top: 16px">
      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        "
      >
        <a-typography-title :level="5" style="margin: 0"> 票档配置 </a-typography-title>
        <span type="secondary" style="font-size: 12px"> {{ filteredPriceTiers.length }} 个 </span>
      </div>

      <!-- 搜索 -->
      <a-input
        v-if="showSearch"
        v-model:value="searchText"
        placeholder="搜索票档名称..."
        allow-clear
        size="small"
        style="margin-bottom: 12px"
      />

      <!-- 列表 -->
      <template v-if="filteredPriceTiers.length">
        <a-space direction="vertical" style="width: 100%" :size="8">
          <a-card
            v-for="tier in filteredPriceTiers"
            :key="tier.id"
            size="small"
            :bordered="true"
            :style="{
              borderLeft: `4px solid ${tier.color || '#1890ff'}`,
            }"
            :body-style="{ padding: '8px 12px' }"
          >
            <div
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
              "
            >
              <a-space :size="6">
                <div
                  :style="{
                    width: '12px',
                    height: '12px',
                    borderRadius: '2px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    backgroundColor: tier.color || '#1890ff',
                  }"
                />
                <span strong style="font-size: 13px">
                  {{ tier.name }}
                </span>
              </a-space>
              <a-badge
                :count="getPriceTierSeatCount(tier.id)"
                :show-zero="true"
                :overflow-count="999999"
                :number-style="{
                  backgroundColor: getPriceTierSeatCount(tier.id) > 0 ? '#52c41a' : '#d9d9d9',
                  fontSize: '11px',
                }"
              />
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center">
              <span type="secondary" style="font-size: 12px"> 票价：{{ tier.price }} </span>
              <div style="display: flex; justify-content: flex-end; align-items: center">
                <a-space size="small">
                  <a-tooltip
                    :title="
                      selectedSeatIds.length
                        ? `将选中座位分配到 ${tier.name}`
                        : '请先在画布上选择座位'
                    "
                  >
                    <a-button
                      type="text"
                      size="small"
                      :disabled="!selectedSeatIds.length"
                      style="font-size: 12px"
                      @click="handleAssignSeats(tier.id)"
                    >
                      <template #icon>
                        <PlusCircleOutlined />
                      </template>
                    </a-button>
                  </a-tooltip>

                  <a-tooltip title="编辑票档">
                    <a-button
                      type="text"
                      size="small"
                      style="font-size: 12px"
                      @click="emit('editPriceTier', tier)"
                    >
                      <template #icon>
                        <EditOutlined />
                      </template>
                    </a-button>
                  </a-tooltip>

                  <a-tooltip title="删除票档">
                    <a-button
                      type="text"
                      size="small"
                      danger
                      style="font-size: 12px"
                      @click="emit('deletePriceTier', tier.id)"
                    >
                      <template #icon>
                        <DeleteOutlined />
                      </template>
                    </a-button>
                  </a-tooltip>
                </a-space>
              </div>
            </div>
          </a-card>
        </a-space>
      </template>

      <a-empty
        v-else
        :image="undefined"
        :description="searchText ? '没有匹配的票档' : '暂无票档配置'"
        style="padding: 24px 0"
      />
    </div>
  </div>
</template>

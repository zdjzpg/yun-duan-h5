<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Modal from 'ant-design-vue/es/modal'
import { PlusCircleOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import type { Zone, Seat } from '../types.simplified'
import ZoneConfigModal from '../modals/ZoneConfigModal.vue'
import { ZONE_SEARCH_THRESHOLD } from '../utils/constants'
import draggable from 'vuedraggable'

const props = defineProps<{
  venueId: string
  currentFloorId: string
  zones: Zone[]
  seats: Seat[]
  selectedSeatIds?: string[]
}>()

const emit = defineEmits<{
  (e: 'updateZone', zoneId: string, updates: Partial<Zone>): void
  (e: 'deleteZone', zoneId: string): void
  (e: 'assignSeatsToZone', zoneId: string): void
}>()

const modalVisible = ref(false)
const editingZone = ref<Zone | undefined>(undefined)

const searchText = ref('')
const seatCountFilter = ref<'all' | 'empty' | 'small' | 'medium' | 'large'>('all')

const currentFloorZones = computed(() =>
  props.zones.filter((z: Zone) => z.floorId === props.currentFloorId),
)

const sortedZones = computed(() =>
  [...currentFloorZones.value].sort((a: Zone, b: Zone) => a.order - b.order),
)

const getZoneSeatCount = (zoneId: string): number =>
  props.seats.filter((s: Seat) => s.zoneId === zoneId && s.floorId === props.currentFloorId).length

const showSearchAndFilter = computed(() => currentFloorZones.value.length >= ZONE_SEARCH_THRESHOLD)

const filteredZones = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  return sortedZones.value.filter((zone: Zone) => {
    const seatCount = getZoneSeatCount(zone.id)
    const matchesSearch =
      !keyword ||
      zone.name.toLowerCase().includes(keyword) ||
      (zone.shortName || '').toLowerCase().includes(keyword)

    let matchesSeatCount = true
    switch (seatCountFilter.value) {
      case 'empty':
        matchesSeatCount = seatCount === 0
        break
      case 'small':
        matchesSeatCount = seatCount > 0 && seatCount <= 50
        break
      case 'medium':
        matchesSeatCount = seatCount > 50 && seatCount <= 200
        break
      case 'large':
        matchesSeatCount = seatCount > 200
        break
      case 'all':
      default:
        matchesSeatCount = true
    }

    return matchesSearch && matchesSeatCount
  })
})

const openEditModal = (zone?: Zone) => {
  editingZone.value = zone
  modalVisible.value = true
}

const handleZoneOk = (values: {
  name: string
  shortName?: string
  color: string
  order: number
}) => {
  const zone = editingZone.value as Zone | undefined
  if (zone) {
    emit('updateZone', zone.id, values)
  }
  modalVisible.value = false
  editingZone.value = undefined
}

const handleZoneCancel = () => {
  modalVisible.value = false
  editingZone.value = undefined
}

const handleDeleteZone = (zoneId: string) => {
  const seatCount = getZoneSeatCount(zoneId)
  if (seatCount > 0) {
    Modal.confirm({
      title: '删除座区',
      content: `座区内有 ${seatCount} 个座位，删除后这些座位将失去座区关联，确定要删除吗？`,
      okText: '删除',
      okType: 'danger' as any,
      cancelText: '取消',
      centered: true,
      onOk: () => emit('deleteZone', zoneId),
    } as any)
  } else {
    emit('deleteZone', zoneId)
  }
}

const draggableZones = ref<Zone[]>([])

watch(
  filteredZones,
  (zones) => {
    draggableZones.value = zones.slice()
  },
  { immediate: true },
)

const handleDragEnd = () => {
  draggableZones.value.forEach((zone: Zone, index: number) => {
    const targetOrder = index + 1
    if (zone.order !== targetOrder) {
      emit('updateZone', zone.id, { order: targetOrder })
    }
  })
}
</script>

<template>
  <div style="display: flex; flex-direction: column">
    <!-- 搜索与筛选（座区数量较多时显示） -->
    <div v-if="showSearchAndFilter" style="width: 100%; margin-bottom: 12px">
      <a-space direction="vertical" size="small" style="width: 100%">
        <a-input
          v-model:value="searchText"
          placeholder="搜索座区名称..."
          allow-clear
          size="small"
        />
        <a-select v-model:value="seatCountFilter" size="small" style="width: 100%">
          <a-select-option value="all"> 全部座区 </a-select-option>
          <a-select-option value="empty"> 空座区（0 座） </a-select-option>
          <a-select-option value="small"> 1-50 座 </a-select-option>
          <a-select-option value="medium"> 51-200 座 </a-select-option>
          <a-select-option value="large"> 200 座以上 </a-select-option>
        </a-select>
      </a-space>
    </div>

    <!-- 座区列表 -->
    <div style="overflow-y: auto; max-height: 400px">
      <template v-if="sortedZones.length === 0">
        <a-empty description="暂无座区" style="padding: 24px 0" />
        <div
          style="
            margin-top: 16px;
            padding: 12px 16px;
            background: #f5f5f5;
            border-radius: 8px;
            font-size: 13px;
            color: #595959;
            line-height: 1.6;
            text-align: center;
          "
        >
          💡 选中座位后，在右侧面板或右键菜单中创建座区。
        </div>
      </template>

      <template v-else-if="filteredZones.length === 0">
        <a-empty description="未找到符合条件的座区" style="padding: 24px 0">
          <a-typography-text type="secondary" style="font-size: 12px">
            <template v-if="searchText"> 关键字“{{ searchText }}”无匹配结果 </template>
            <template v-else-if="seatCountFilter !== 'all'"> 当前筛选条件下无座区 </template>
          </a-typography-text>
        </a-empty>
      </template>

      <template v-else>
        <draggable
          v-model="draggableZones"
          item-key="id"
          handle=".zone-item-handle"
          @end="handleDragEnd"
        >
          <template #item="{ element: zone }">
            <div :key="zone.id" style="cursor: move; margin-bottom: 8px">
              <a-card
                size="small"
                :bordered="true"
                :style="{
                  borderLeft: `4px solid ${zone.color || '#ff4d4f'}`,
                }"
                :body-style="{ padding: '8px 12px' }"
              >
                <div style="display: flex; align-items: center; gap: 8px">
                  <span class="zone-item-handle" style="cursor: grab; color: #8c8c8c">⋮⋮</span>
                  <div style="flex: 1">
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
                            backgroundColor: zone.color || '#ff4d4f',
                            borderRadius: '2px',
                            border: '1px solid rgba(0,0,0,0.1)',
                          }"
                        />
                        <a-typography-text strong style="font-size: 13px">
                          {{ zone.name }}
                        </a-typography-text>
                      </a-space>
                      <a-badge
                        :count="getZoneSeatCount(zone.id)"
                        :show-zero="true"
                        :number-style="{
                          backgroundColor: getZoneSeatCount(zone.id) > 0 ? '#52c41a' : '#d9d9d9',
                          fontSize: '11px',
                        }"
                      />
                    </div>

                    <div style="display: flex; justify-content: flex-end">
                      <a-space size="small">
                        <a-tooltip
                          :title="
                            selectedSeatIds && selectedSeatIds.length
                              ? `将选中的 ${selectedSeatIds.length} 个座位分配到 ${zone.name}`
                              : '请先在画布上选择座位'
                          "
                        >
                          <a-button
                            type="text"
                            size="small"
                            :disabled="!selectedSeatIds || !selectedSeatIds.length"
                            @click="emit('assignSeatsToZone', zone.id)"
                            style="font-size: 12px"
                          >
                            <template #icon>
                              <PlusCircleOutlined />
                            </template>
                          </a-button>
                        </a-tooltip>

                        <a-tooltip title="编辑座区">
                          <a-button
                            type="text"
                            size="small"
                            style="font-size: 12px"
                            @click="openEditModal(zone)"
                          >
                            <template #icon>
                              <EditOutlined />
                            </template>
                          </a-button>
                        </a-tooltip>

                        <a-tooltip title="删除座区">
                          <a-button
                            type="text"
                            size="small"
                            danger
                            style="font-size: 12px"
                            @click="handleDeleteZone(zone.id)"
                          >
                            <template #icon>
                              <DeleteOutlined />
                            </template>
                          </a-button>
                        </a-tooltip>
                      </a-space>
                    </div>
                  </div>
                </div>
              </a-card>
            </div>
          </template>
        </draggable>
      </template>
    </div>

    <ZoneConfigModal
      :visible="modalVisible"
      :zone="editingZone"
      :venue-id="venueId"
      :floor-id="currentFloorId"
      :existing-zones="currentFloorZones"
      @ok="handleZoneOk"
      @cancel="handleZoneCancel"
    />
  </div>
</template>

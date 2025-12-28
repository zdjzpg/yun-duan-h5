<script setup lang="ts">
import { PlusOutlined, SettingOutlined } from '@ant-design/icons-vue'
import type { Floor, Seat, Zone } from '../types.simplified'

const props = defineProps<{
  floors: Floor[]
  activeFloorId: string
  seats: Seat[]
  zones?: Zone[]
}>()

const emit = defineEmits<{
  (e: 'floorChange', floorId: string): void
  (e: 'newFloor'): void
  (e: 'manageFloors'): void
}>()

const handleFloorClick = (floorId: string) => {
  emit('floorChange', floorId)
}
</script>

<template>
  <div
    class="seat-map-editor-panel-content"
    style="padding-right: 16px; box-sizing: border-box; overflow-x: hidden; word-break: break-word"
  >
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
        <a-space size="small">
          <a-tooltip title="新建楼层 (Ctrl+Shift+N)">
            <a-button type="text" size="small" @click="emit('newFloor')">
              <PlusOutlined />
            </a-button>
          </a-tooltip>
          <a-tooltip title="管理楼层">
            <a-button type="text" size="small" @click="emit('manageFloors')">
              <SettingOutlined />
            </a-button>
          </a-tooltip>
        </a-space>
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
          <a-typography-text
            :strong="floor.id === activeFloorId"
            :style="{
              color: floor.id === activeFloorId ? '#1890ff' : '#262626',
            }"
          >
            {{ floor.name }}
          </a-typography-text>
          <a-typography-text
            type="secondary"
            style="font-size: 12px"
            :style="{
              color: floor.id === activeFloorId ? '#1890ff' : '#8c8c8c',
            }"
          >
            {{ seats.filter((seat: Seat) => seat.floorId === floor.id).length }}
          </a-typography-text>
        </div>
      </a-space>

      <a-typography-text v-if="floors.length === 0" type="secondary" style="font-size: 12px">
        暂无楼层，请新建
      </a-typography-text>
    </div>

    <a-card
      v-if="floors.find((floor: Floor) => floor.id === activeFloorId)"
      size="small"
      style="margin-top: 16px; background: #fafafa; border: 1px solid #f0f0f0"
    >
      <div style="margin-bottom: 8px">
        <a-typography-text strong style="font-size: 13px"> 当前楼层 </a-typography-text>
      </div>
      <a-space direction="vertical" style="width: 100%" :size="8">
        <div>
          <a-typography-text type="secondary" style="font-size: 12px"> 名称: </a-typography-text>
          <a-typography-text strong style="font-size: 12px">
            {{ floors.find((floor: Floor) => floor.id === activeFloorId)?.name }}
          </a-typography-text>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px">
          <a-statistic
            title="座位"
            :value="seats.filter((seat: Seat) => seat.floorId === activeFloorId).length"
            :value-style="{ fontSize: '20px', color: '#1890ff' }"
          />
          <a-statistic
            v-if="zones"
            title="座区"
            :value="zones.filter((zone: Zone) => zone.floorId === activeFloorId).length"
            :value-style="{ fontSize: '20px', color: '#52c41a' }"
          />
        </div>
      </a-space>
    </a-card>
  </div>
</template>

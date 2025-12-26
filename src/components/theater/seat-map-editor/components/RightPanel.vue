<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Floor, Seat, Stage, Zone } from '../types.simplified'
import SeatEditPanel from '../components/SeatEditPanel.vue'
import StageEditPanel from '../components/StageEditPanel.vue'
import ZoneListPanel from '../components/ZoneListPanel.vue'

type SelectedElement =
  | { type: 'seat'; id: string }
  | { type: 'seats'; ids: string[] }
  | { type: 'stage'; id: string }
  | null

const props = defineProps<{
  selectedElement: SelectedElement
  floor?: Floor
  selectedSeats: Seat[]
  selectedStage?: Stage
  zones?: Zone[]
  stage?: Stage
  seats?: Seat[]
  venueId?: string
  currentFloorId?: string
}>()

const emit = defineEmits<{
  (e: 'updateSeatStatus', status: string, disabledReason?: string): void
  (e: 'deleteSeats'): void
  (e: 'createZone'): void
  (e: 'assignToZone', zoneId: string): void
  (e: 'updateStage', stageId: string, updates: Partial<Stage>): void
  (e: 'deleteStage', stageId: string): void
  (e: 'addStage'): void
  (e: 'updateZone', zoneId: string, updates: Partial<Zone>): void
  (e: 'deleteZone', zoneId: string): void
}>()

const activeKey = ref<'seat' | 'stage' | 'zone'>('seat')

watch(
  () => props.selectedElement,
  (el) => {
    if (!el) {
      activeKey.value = 'seat'
      return
    }
    if (el.type === 'seat' || el.type === 'seats') {
      activeKey.value = 'seat'
    } else if (el.type === 'stage') {
      activeKey.value = 'stage'
    }
  },
)

const hasSeats = computed(() => (props.seats || []).length > 0)
</script>

<template>
  <div
    class="seat-map-editor-panel-content"
    style="
      display: flex;
      flex-direction: column;
      height: 100%;
      padding-right: 16px;
      box-sizing: border-box;
      overflow-x: hidden;
      word-break: break-word;
    "
  >
    <div style="margin-bottom: 8px">
      <a-segmented
        v-model:value="activeKey"
        :options="[
          { label: '💺 座位', value: 'seat' },
          { label: '🎭 舞台', value: 'stage' },
          { label: '🏷�?座区', value: 'zone' },
        ]"
        block
      />
    </div>

    <div style="flex: 1; overflow: auto">
      <template v-if="activeKey === 'seat'">
        <SeatEditPanel
          :selected-seats="selectedSeats"
          :zones="zones || []"
          @update-status="(status: string, reason?: string) =>
            emit('updateSeatStatus', status, reason)"
          @delete-seats="() => emit('deleteSeats')"
          @create-zone="() => emit('createZone')"
          @assign-to-zone="(zoneId: string) => emit('assignToZone', zoneId)"
        />
      </template>

      <template v-else-if="activeKey === 'stage'">
        <StageEditPanel
          :selected-stage="selectedStage"
          :stage="stage"
          @update-stage="(id: string, updates: Partial<Stage>) =>
            emit('updateStage', id, updates)"
          @delete-stage="(id: string) => emit('deleteStage', id)"
          @add-stage="() => emit('addStage')"
        />
      </template>

      <template v-else>
        <ZoneListPanel
          v-if="venueId && currentFloorId && zones && seats"
          :venue-id="venueId"
          :current-floor-id="currentFloorId"
          :zones="zones"
          :seats="seats"
          :selected-seat-ids="selectedSeats.map((s: Seat) => s.id)"
          @update-zone="(zoneId: string, updates: Partial<Zone>) =>
            emit('updateZone', zoneId, updates)"
          @delete-zone="(zoneId: string) => emit('deleteZone', zoneId)"
          @assign-seats-to-zone="(zoneId: string) => emit('assignToZone', zoneId)"
        />
        <div v-else style="padding: 24px 0">
          <a-empty description="座区管理暂不可用" />
        </div>
      </template>
    </div>
  </div>
</template>


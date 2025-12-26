<script setup lang="ts">
import { computed } from 'vue'
import type { Seat, Stage } from './types.simplified'

const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 800
const SEAT_SIZE = 30

const props = withDefaults(
  defineProps<{
    seats: Seat[]
    stage?: Stage
    showSeatLabels?: boolean
    selectedSeatIds?: string[]
  }>(),
  {
    seats: () => [],
    showSeatLabels: true,
  },
)

const emit = defineEmits<{
  (e: 'select', seatId: string): void
  (e: 'selectStage'): void
}>()

const stageStyle = computed(() => {
  if (!props.stage) {
    return null
  }
  const s = props.stage
  const left = s.x + CANVAS_WIDTH / 2 - s.width / 2
  const top = s.y + CANVAS_HEIGHT / 2 - s.height / 2
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${s.width}px`,
    height: `${s.height}px`,
  }
})

const positionedSeats = computed(() =>
  (props.seats || []).map((seat: Seat) => {
    const left = seat.x + CANVAS_WIDTH / 2 - SEAT_SIZE / 2
    const top = seat.y + CANVAS_HEIGHT / 2 - SEAT_SIZE / 2
    const color =
      seat.zoneColor ||
      (seat.status === 'available' ? '#FFD666' : '#FF4D4F')
    const selected = (props.selectedSeatIds || []).includes(seat.id)
    return {
      seat,
      left,
      top,
      color,
      selected,
    }
  }),
)
</script>

<template>
  <div class="seat-canvas">
    <div
      v-if="stage && stageStyle"
      class="seat-canvas__stage"
      :style="stageStyle"
      @click.stop="emit('selectStage')"
    >
      {{ stage.name || '舞台方向' }}
    </div>

    <div
      v-for="item in positionedSeats"
      :key="item.seat.id"
      class="seat-canvas__seat"
      :style="{
        left: item.left + 'px',
        top: item.top + 'px',
        backgroundColor: item.color,
      }"
      :class="{ 'seat-canvas__seat--selected': item.selected }"
      @click="emit('select', item.seat.id)"
    >
      <span
        v-if="showSeatLabels"
        class="seat-canvas__seat-label"
      >
        {{ item.seat.rowLabel }}-{{ item.seat.seatLabel }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.seat-canvas {
  position: relative;
  width: 1200px;
  height: 800px;
  margin: 0 auto;
  background-image: linear-gradient(#f0f0f0 1px, transparent 0),
    linear-gradient(90deg, #f0f0f0 1px, transparent 0);
  background-size: 20px 20px;
  background-color: #fafafa;
  border-radius: 4px;
  overflow: hidden;
}

.seat-canvas__stage {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #dedede;
  color: #555;
  font-size: 14px;
  border-radius: 20px;
}

.seat-canvas__seat {
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #333;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.seat-canvas__seat-label {
  white-space: nowrap;
}

.seat-canvas__seat--selected {
  box-shadow: 0 0 0 2px #1677ff;
}
</style>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import type { Seat, Stage } from '../types.simplified'
import { renderGrid, renderSeat, renderStage, renderAllGroupBounds, type CanvasViewport, snapToGrid } from '../canvas/canvas.utils'
import { useCanvasInteractionEnhanced } from '../composables/useCanvasInteraction.enhanced'

type SelectedElement =
  | { type: 'seat'; id: string }
  | { type: 'seats'; ids: string[] }
  | { type: 'stage'; id: string }
  | null

const props = withDefaults(
  defineProps<{
    seats: Seat[]
    stage?: Stage
    selectedSeatIds: string[]
    selectedElement: SelectedElement
    width?: number
    height?: number
    showGrid?: boolean
    enableSnap?: boolean
    showSeatLabels?: boolean
    viewport: CanvasViewport
    /**
     * 是否允许舞台交互（点击、拖拽等）
     * 在仅展示场景（如 TMS 售票）中可以关闭
     */
    enableStageInteraction?: boolean
    enableSeatDrag?: boolean
  }>(),
  {
    seats: () => [],
    selectedSeatIds: () => [],
    selectedElement: null,
    width: 1200,
    height: 700,
    showGrid: true,
    enableSnap: true,
    showSeatLabels: true,
    viewport: () => ({
      offsetX: 0,
      offsetY: 0,
      scale: 1,
    }),
    enableStageInteraction: true,
    enableSeatDrag: true,
  },
)

const emit = defineEmits<{
  (e: 'seat-select', ids: string[]): void
  (e: 'seat-move', id: string, x: number, y: number): void
  (e: 'seats-move', updates: Array<{ id: string; x: number; y: number }>): void
  (e: 'stage-select', id: string): void
  (e: 'stage-move', id: string, x: number, y: number): void
  (e: 'viewport-change', viewport: CanvasViewport): void
  (e: 'seats-delete', ids: string[]): void
  (e: 'seats-copy', ids: string[]): void
  (e: 'seats-paste'): void
  (e: 'context-menu', worldX: number, worldY: number): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

const seatsRef = computed(() => props.seats)
const stagesRef = computed<Stage[]>(() =>
  props.stage && props.enableStageInteraction ? [props.stage] : [],
)
const viewportRef = computed<CanvasViewport>(() => props.viewport)
const selectedSeatIdsRef = computed<string[]>(() => props.selectedSeatIds)

const { dragState, selectionBox, hoveredSeatId, hoveredStageId } =
  useCanvasInteractionEnhanced({
    canvasRef,
    seats: seatsRef,
    stages: stagesRef,
    viewport: viewportRef,
    canvasWidth: props.width,
    selectedSeatIds: selectedSeatIdsRef,
    enableSnap: props.enableSnap,
    enableSeatDrag: props.enableSeatDrag,
    onSeatSelect: (ids) => emit('seat-select', ids),
    onSeatMove: (seatId, x, y) => emit('seat-move', seatId, x, y),
    onSeatsMove: (updates) => emit('seats-move', updates),
    onStageSelect: (stageId) => emit('stage-select', stageId),
    onStageMove: (stageId, x, y) => emit('stage-move', stageId, x, y),
    onViewportChange: (vp) => emit('viewport-change', vp),
    onSeatsDelete: (ids) => emit('seats-delete', ids),
    onSeatsCopy: (ids) => emit('seats-copy', ids),
    onSeatsPaste: () => emit('seats-paste'),
    onContextMenu: (x, y) => emit('context-menu', x, y),
  })

const renderCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = props.width
  const height = props.height

  if (canvas.width !== width) {
    canvas.width = width
  }
  if (canvas.height !== height) {
    canvas.height = height
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const currentViewport = props.viewport

  ctx.save()
  ctx.translate(currentViewport.offsetX, currentViewport.offsetY)
  ctx.scale(currentViewport.scale, currentViewport.scale)

  if (props.showGrid) {
    renderGrid(ctx, currentViewport, width, height)
  }

  if (props.stage) {
    const stage = props.stage
    const isStageSelected =
      props.selectedElement?.type === 'stage' && props.selectedElement.id === stage.id
    const isStageHovered = hoveredStageId.value === stage.id

    let displayStage: Stage = stage

    if (
      dragState.isDragging &&
      dragState.dragType === 'stage' &&
      dragState.dragTargetId === stage.id
    ) {
      const deltaX = dragState.currentX - dragState.startX
      const deltaY = dragState.currentY - dragState.startY

      let tempX = stage.x + deltaX
      let tempY = stage.y + deltaY

      if (props.enableSnap) {
        tempX = snapToGrid(tempX)
        tempY = snapToGrid(tempY)
      }

      displayStage = { ...stage, x: tempX, y: tempY }
    }

    renderStage(ctx, displayStage, width, height, isStageSelected || isStageHovered)
  }

  seatsRef.value.forEach((seat: Seat) => {
    const isSelected = props.selectedSeatIds.includes(seat.id)
    const isHovered = hoveredSeatId.value === seat.id

    let displaySeat: Seat = seat

    if (dragState.isDragging && dragState.dragType === 'seat') {
      const isDragTarget = dragState.dragTargetId === seat.id
      const isInSelection =
        props.selectedSeatIds.includes(seat.id) &&
        props.selectedSeatIds.includes(dragState.dragTargetId || '')

      if ((isDragTarget || isInSelection) && !seat.locked) {
        const deltaX = dragState.currentX - dragState.startX
        const deltaY = dragState.currentY - dragState.startY

        let tempX = seat.x + deltaX
        let tempY = seat.y + deltaY

        if (props.enableSnap) {
          tempX = snapToGrid(tempX)
          tempY = snapToGrid(tempY)
        }

        displaySeat = { ...seat, x: tempX, y: tempY }
      }
    }

    renderSeat(ctx, displaySeat, isSelected || isHovered, props.showSeatLabels)
  })

  if (selectionBox.value) {
    const box = selectionBox.value
    const minX = Math.min(box.startX, box.endX)
    const minY = Math.min(box.startY, box.endY)
    const w = Math.abs(box.endX - box.startX)
    const h = Math.abs(box.endY - box.startY)

    ctx.fillStyle = 'rgba(24, 144, 255, 0.1)'
    ctx.fillRect(minX, minY, w, h)

    ctx.strokeStyle = 'rgba(24, 144, 255, 0.8)'
    ctx.lineWidth = 2 / currentViewport.scale
    ctx.strokeRect(minX, minY, w, h)
  }

  const isDraggingSeat = dragState.isDragging && dragState.dragType === 'seat'
  if (!isDraggingSeat) {
    renderAllGroupBounds(ctx, seatsRef.value, currentViewport.scale)
  }

  ctx.restore()
}

let animationFrameId: number | null = null

onMounted(() => {
  const loop = () => {
    renderCanvas()
    animationFrameId = window.requestAnimationFrame(loop)
  }

  // 先渲染一帧，保证初始不会空白
  renderCanvas()
  animationFrameId = window.requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
})

defineExpose({
  getCanvas: () => canvasRef.value,
})
</script>

<template>
  <div
    style="
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #fafafa;
      position: relative;
    "
  >
    <canvas
      ref="canvasRef"
      :width="width"
      :height="height"
      style="
        background: #fafafa;
      "
    />
  </div>
</template>

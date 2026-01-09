/**
Canvas 交互
保持选择、拖拽、框选、滚轮缩放、键盘快捷键等交互逻辑一致
 */

import { onMounted, reactive, ref } from 'vue'
import type { Seat, Stage } from '../types.simplified'
import {
  screenToWorld,
  getSeatAtPosition,
  getStageAtPosition,
  snapToGrid,
  type CanvasViewport,
} from '../canvas/canvas.utils'

const DRAG_THRESHOLD = 3

type DragType = 'seat' | 'stage' | 'viewport' | 'selection' | null

interface DragState {
  isDragging: boolean
  dragType: DragType
  dragTargetId: string | null
  startX: number
  startY: number
  currentX: number
  currentY: number
}

export interface SelectionBox {
  startX: number
  startY: number
  endX: number
  endY: number
}

export interface UseCanvasInteractionProps {
  canvasRef: { value: HTMLCanvasElement | null }
  seats: { value: Seat[] }
  stages: { value: Stage[] }
  viewport: { value: CanvasViewport }
  canvasWidth?: number
  selectedSeatIds: { value: string[] }
  enableSnap?: boolean
  /** 是否允许拖动座位（TMS 场景下关闭） */
  enableSeatDrag?: boolean
  onSeatSelect?: (seatIds: string[]) => void
  onSeatMove?: (seatId: string, x: number, y: number) => void
  onSeatsMove?: (updates: Array<{ id: string; x: number; y: number }>) => void
  onStageSelect?: (stageId: string) => void
  onStageMove?: (stageId: string, x: number, y: number) => void
  onViewportChange?: (viewport: CanvasViewport) => void
  onSeatsDelete?: (seatIds: string[]) => void
  onSeatsCopy?: (seatIds: string[]) => void
  onSeatsPaste?: () => void
  onContextMenu?: (worldX: number, worldY: number) => void
}

export function useCanvasInteractionEnhanced({
  canvasRef,
  seats,
  stages,
  viewport,
  canvasWidth = 1200,
  selectedSeatIds,
  enableSnap = true,
  enableSeatDrag = true,
  onSeatSelect,
  onSeatMove,
  onSeatsMove,
  onStageSelect,
  onStageMove,
  onViewportChange,
  onSeatsDelete,
  onSeatsCopy,
  onSeatsPaste,
  onContextMenu,
}: UseCanvasInteractionProps) {
  const dragState = reactive<DragState>({
    isDragging: false,
    dragType: null,
    dragTargetId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  })

  const selectionBox = ref<SelectionBox | null>(null)
  const hoveredSeatId = ref<string | null>(null)
  const hoveredStageId = ref<string | null>(null)
  const pressedKeys = ref<Set<string>>(new Set())

  const getSeatsInSelectionBox = (box: SelectionBox): string[] => {
    const minX = Math.min(box.startX, box.endX)
    const maxX = Math.max(box.startX, box.endX)
    const minY = Math.min(box.startY, box.endY)
    const maxY = Math.max(box.startY, box.endY)

    return seats.value
      .filter((seat) => {
        const seatCenterX = seat.x + 10
        const seatCenterY = seat.y + 10
        return (
          seatCenterX >= minX && seatCenterX <= maxX && seatCenterY >= minY && seatCenterY <= maxY
        )
      })
      .map((seat) => seat.id)
  }

  const handleMouseDown = (e: MouseEvent) => {
    if (!canvasRef.value) return

    const rect = canvasRef.value.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const vp = viewport.value
    const worldPos = screenToWorld(screenX, screenY, vp)

    if (e.button === 2 && onContextMenu) {
      const isSpacePressed = pressedKeys.value.has(' ')
      const clickedSeat = getSeatAtPosition(worldPos.x, worldPos.y, seats.value)
      const clickedStage = getStageAtPosition(worldPos.x, worldPos.y, stages.value, canvasWidth)
      const isClickingEmpty = !clickedSeat && !clickedStage && !isSpacePressed

      if (!isClickingEmpty) {
        onContextMenu(worldPos.x, worldPos.y)
      }
    }

    const isSpacePressed = pressedKeys.value.has(' ')

    const clickedSeat = getSeatAtPosition(worldPos.x, worldPos.y, seats.value)
    const clickedStage = getStageAtPosition(worldPos.x, worldPos.y, stages.value, canvasWidth)
    const isClickingEmpty = !clickedSeat && !clickedStage && !isSpacePressed

    if (e.button === 2 && isClickingEmpty) {
      return
    }

    if (clickedSeat && !isSpacePressed) {
      const isLocked = clickedSeat.locked === true || !enableSeatDrag

      dragState.isDragging = true
      dragState.dragType = isLocked ? null : 'seat'
      dragState.dragTargetId = clickedSeat.id
      dragState.startX = worldPos.x
      dragState.startY = worldPos.y
      dragState.currentX = worldPos.x
      dragState.currentY = worldPos.y

      if (onSeatSelect) {
        const currentSelected = selectedSeatIds.value
        if (e.ctrlKey || e.metaKey) {
          if (currentSelected.includes(clickedSeat.id)) {
            onSeatSelect(currentSelected.filter((id: string) => id !== clickedSeat.id))
          } else {
            const clickedSeatData = seats.value.find((s) => s.id === clickedSeat.id)
            if (clickedSeatData?.groupId) {
              const groupSeatIds = seats.value
                .filter((s) => s.groupId === clickedSeatData.groupId)
                .map((s) => s.id)
              const newSelection = [...new Set([...currentSelected, ...groupSeatIds])]
              onSeatSelect(newSelection)
            } else {
              onSeatSelect([...currentSelected, clickedSeat.id])
            }
          }
        } else {
          if (!currentSelected.includes(clickedSeat.id)) {
            const clickedSeatData = seats.value.find((s) => s.id === clickedSeat.id)
            if (clickedSeatData?.groupId) {
              const groupSeatIds = seats.value
                .filter((s) => s.groupId === clickedSeatData.groupId)
                .map((s) => s.id)
              onSeatSelect(groupSeatIds)
            } else {
              onSeatSelect([clickedSeat.id])
            }
          }
        }
      }
      return
    }

    if (clickedStage && !isSpacePressed) {
      dragState.isDragging = true
      dragState.dragType = 'stage'
      dragState.dragTargetId = clickedStage.id
      dragState.startX = worldPos.x
      dragState.startY = worldPos.y
      dragState.currentX = worldPos.x
      dragState.currentY = worldPos.y

      if (onStageSelect) {
        onStageSelect(clickedStage.id)
      }
      return
    }

    if (isSpacePressed) {
      dragState.isDragging = true
      dragState.dragType = 'viewport'
      dragState.dragTargetId = null
      dragState.startX = screenX
      dragState.startY = screenY
      dragState.currentX = screenX
      dragState.currentY = screenY
    } else {
      dragState.isDragging = true
      dragState.dragType = 'selection'
      dragState.dragTargetId = null
      dragState.startX = worldPos.x
      dragState.startY = worldPos.y
      dragState.currentX = worldPos.x
      dragState.currentY = worldPos.y

      selectionBox.value = {
        startX: worldPos.x,
        startY: worldPos.y,
        endX: worldPos.x,
        endY: worldPos.y,
      }
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!canvasRef.value) return

    const rect = canvasRef.value.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const vp = viewport.value
    const worldPos = screenToWorld(screenX, screenY, vp)

    if (dragState.isDragging) {
      if (dragState.dragType === 'selection') {
        selectionBox.value = {
          startX: dragState.startX,
          startY: dragState.startY,
          endX: worldPos.x,
          endY: worldPos.y,
        }
      } else if (dragState.dragType === 'viewport') {
        const deltaX = screenX - dragState.currentX
        const deltaY = screenY - dragState.currentY

        if (onViewportChange) {
          onViewportChange({
            ...vp,
            offsetX: vp.offsetX + deltaX,
            offsetY: vp.offsetY + deltaY,
          })
        }

        dragState.currentX = screenX
        dragState.currentY = screenY
      } else if (dragState.dragType === 'seat' || dragState.dragType === 'stage') {
        dragState.currentX = worldPos.x
        dragState.currentY = worldPos.y
      }
    } else {
      const hoveredSeat = getSeatAtPosition(worldPos.x, worldPos.y, seats.value)
      hoveredSeatId.value = hoveredSeat?.id || null

      const hoveredStage = getStageAtPosition(worldPos.x, worldPos.y, stages.value, canvasWidth)
      hoveredStageId.value = hoveredStage?.id || null
    }
  }

  const handleMouseUp = (e: MouseEvent) => {
    if (!canvasRef.value || !dragState.isDragging) return

    const rect = canvasRef.value.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const vp = viewport.value
    const worldPos = screenToWorld(screenX, screenY, vp)

    if (dragState.dragType === 'selection' && selectionBox.value) {
      const selectedIds = getSeatsInSelectionBox(selectionBox.value)

      const expandedSelection = new Set<string>()
      selectedIds.forEach((seatId: string) => {
        const seat = seats.value.find((s: Seat) => s.id === seatId)
        if (seat?.groupId) {
          const groupSeatIds = seats.value
            .filter((s: Seat) => s.groupId === seat.groupId)
            .map((s: Seat) => s.id)
          groupSeatIds.forEach((id: string) => expandedSelection.add(id))
        } else {
          expandedSelection.add(seatId)
        }
      })

      const finalSelection = Array.from(expandedSelection)

      if (onSeatSelect) {
        if (e.ctrlKey || e.metaKey) {
          const currentSelected = selectedSeatIds.value
          const newSelection = [...new Set([...currentSelected, ...finalSelection])]
          onSeatSelect(newSelection)
        } else {
          onSeatSelect(finalSelection)
        }
      }

      selectionBox.value = null
    }

    if (dragState.dragType === 'seat' && dragState.dragTargetId) {
      const deltaX = worldPos.x - dragState.startX
      const deltaY = worldPos.y - dragState.startY
      const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      if (dragDistance < DRAG_THRESHOLD) {
        dragState.isDragging = false
        dragState.dragType = null
        dragState.dragTargetId = null
        dragState.startX = 0
        dragState.startY = 0
        dragState.currentX = 0
        dragState.currentY = 0
        return
      }

      const currentSelected = selectedSeatIds.value

      if (currentSelected.includes(dragState.dragTargetId)) {
        const updates = currentSelected
          .map((seatId: string) => {
            const seat = seats.value.find((s: Seat) => s.id === seatId)
            if (!seat || seat.locked) return null
            let newX = seat.x + deltaX
            let newY = seat.y + deltaY

            if (enableSnap) {
              newX = snapToGrid(newX)
              newY = snapToGrid(newY)
            }

            return { id: seatId, x: newX, y: newY }
          })
          .filter(Boolean) as Array<{ id: string; x: number; y: number }>

        if (updates.length > 0) {
          if (onSeatsMove) {
            onSeatsMove(updates)
          } else if (onSeatMove) {
            updates.forEach(({ id, x, y }) => {
              onSeatMove(id, x, y)
            })
          }
        }
      } else {
        const seat = seats.value.find((s) => s.id === dragState.dragTargetId)
        if (seat && !seat.locked && onSeatMove) {
          let newX = seat.x + deltaX
          let newY = seat.y + deltaY

          if (enableSnap) {
            newX = snapToGrid(newX)
            newY = snapToGrid(newY)
          }

          if (newX !== seat.x || newY !== seat.y) {
            onSeatMove(dragState.dragTargetId, newX, newY)
          }
        }
      }
    }

    if (dragState.dragType === 'stage' && dragState.dragTargetId && onStageMove) {
      const deltaX = worldPos.x - dragState.startX
      const deltaY = worldPos.y - dragState.startY
      const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      if (dragDistance >= DRAG_THRESHOLD) {
        const stage = stages.value.find((s) => s.id === dragState.dragTargetId)
        if (stage) {
          let newX = stage.x + deltaX
          let newY = stage.y + deltaY

          if (enableSnap) {
            newX = snapToGrid(newX)
            newY = snapToGrid(newY)
          }

          onStageMove(dragState.dragTargetId, newX, newY)
        }
      }
    }

    dragState.isDragging = false
    dragState.dragType = null
    dragState.dragTargetId = null
    dragState.startX = 0
    dragState.startY = 0
    dragState.currentX = 0
    dragState.currentY = 0
  }

  const handleWheel = (e: WheelEvent) => {
    if (!canvasRef.value || !onViewportChange) return

    e.preventDefault()

    if (!e.ctrlKey && !e.metaKey) return

    const rect = canvasRef.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const vp = viewport.value

    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.1, Math.min(5, vp.scale * delta))

    const worldPosBefore = screenToWorld(mouseX, mouseY, vp)
    const newOffsetX = mouseX - worldPosBefore.x * newScale
    const newOffsetY = mouseY - worldPosBefore.y * newScale

    onViewportChange({
      offsetX: newOffsetX,
      offsetY: newOffsetY,
      scale: newScale,
    })
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    pressedKeys.value = new Set(pressedKeys.value).add(e.key)

    const target = e.target as HTMLElement
    const isInputFocused =
      target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

    if (isInputFocused) return

    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedSeatIds.value.length > 0) {
      e.preventDefault()
      if (onSeatsDelete) {
        onSeatsDelete(selectedSeatIds.value)
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault()
      if (onSeatSelect) {
        onSeatSelect(seats.value.map((s) => s.id))
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedSeatIds.value.length > 0) {
      e.preventDefault()
      if (onSeatsCopy) {
        onSeatsCopy(selectedSeatIds.value)
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault()
      if (onSeatsPaste) {
        onSeatsPaste()
      }
    }

    if (e.key === 'Escape') {
      if (onSeatSelect) {
        onSeatSelect([])
      }
    }
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    const next = new Set(pressedKeys.value)
    next.delete(e.key)
    pressedKeys.value = next
  }

  onMounted(() => {
    const canvas = canvasRef.value
    if (!canvas) return

    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  })

  return {
    dragState,
    selectionBox,
    hoveredSeatId,
    hoveredStageId,
    pressedKeys,
  }
}

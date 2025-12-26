/**
 * Canvas 工具函数
 *
 */

import type { Seat, Stage } from '../types.simplified'
import { getContrastTextColor, darkenByLightness } from '../canvas/color.utils'

export interface CanvasViewport {
  offsetX: number
  offsetY: number
  scale: number
}

export const SEAT_CONFIG = {
  SIZE: 30,
  BORDER_WIDTH: 1.5,
  FONT_SIZE: 10,
  MARGIN: 1,
} as const

export const STAGE_CONFIG = {
  MIN_WIDTH: 100,
  MIN_HEIGHT: 30,
  BORDER_WIDTH: 2,
  FONT_SIZE: 14,
} as const

export const GRID_CONFIG = {
  SIZE: 1,
  DISPLAY_SIZE: 10,
  COLOR: '#EDEDED',
  MAJOR_INTERVAL: 5,
  MAJOR_COLOR: '#e8e8e8',
} as const

export const SEAT_COLORS = {
  available: '#52c41a',
  unavailable: '#d9d9d9',
  sold: '#f5222d',
  locked: '#faad14',
} as const

export const SEAT_TYPE_COLORS = {
  standard: '#000000',
  vip: '#722ed1',
  couple: '#eb2f96',
  wheelchair: '#13c2c2',
} as const

export const SELECTION_COLOR = '#1890ff'
export const SELECTION_WIDTH = 2

export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: CanvasViewport,
): { x: number; y: number } {
  return {
    x: (screenX - viewport.offsetX) / viewport.scale,
    y: (screenY - viewport.offsetY) / viewport.scale,
  }
}

export function worldToScreen(
  worldX: number,
  worldY: number,
  viewport: CanvasViewport,
): { x: number; y: number } {
  return {
    x: worldX * viewport.scale + viewport.offsetX,
    y: worldY * viewport.scale + viewport.offsetY,
  }
}

export function isPointInSeat(
  x: number,
  y: number,
  seat: Seat,
  seatSize: number = SEAT_CONFIG.SIZE,
): boolean {
  if (x < seat.x || x > seat.x + seatSize || y < seat.y || y > seat.y + seatSize) {
    return false
  }

  const centerX = seat.x + seatSize / 2
  const centerY = seat.y + seatSize / 2
  const radius = (seatSize - 2 * SEAT_CONFIG.MARGIN) / 2
  const dx = x - centerX
  const dy = y - centerY
  return dx * dx + dy * dy <= radius * radius
}

export function getSeatAtPosition(x: number, y: number, seats: Seat[]): Seat | null {
  for (let i = seats.length - 1; i >= 0; i--) {
    const seat = seats[i]
    if (seat && isPointInSeat(x, y, seat)) {
      return seat
    }
  }
  return null
}

export function isPointInStage(x: number, y: number, stage: Stage, canvasWidth: number): boolean {
  const actualWidth = stage.width
  const actualHeight = Math.round(stage.height / 10) * 10

  const left = stage.x - actualWidth / 2
  const right = stage.x + actualWidth / 2
  const top = stage.y - actualHeight / 2
  const bottom = stage.y + actualHeight / 2

  return x >= left && x <= right && y >= top && y <= bottom
}

export function getStageAtPosition(
  x: number,
  y: number,
  stages: Stage[],
  canvasWidth: number = 1200,
): Stage | null {
  for (let i = stages.length - 1; i >= 0; i--) {
    const stage = stages[i]
    if (stage && isPointInStage(x, y, stage, canvasWidth)) {
      return stage
    }
  }
  return null
}

export function snapToGrid(value: number, gridSize: number = GRID_CONFIG.DISPLAY_SIZE): number {
  return Math.round(value / gridSize) * gridSize
}

export function snapSeatToGrid(seat: Seat): Seat {
  return {
    ...seat,
    x: snapToGrid(seat.x),
    y: snapToGrid(seat.y),
  }
}

export function renderGrid(
  ctx: CanvasRenderingContext2D,
  viewport: CanvasViewport,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const worldTopLeft = screenToWorld(0, 0, viewport)
  const worldBottomRight = screenToWorld(canvasWidth, canvasHeight, viewport)

  const gridSize = GRID_CONFIG.DISPLAY_SIZE
  const startX = Math.floor(worldTopLeft.x / gridSize) * gridSize
  const startY = Math.floor(worldTopLeft.y / gridSize) * gridSize
  const endX = Math.ceil(worldBottomRight.x / gridSize) * gridSize
  const endY = Math.ceil(worldBottomRight.y / gridSize) * gridSize

  ctx.strokeStyle = GRID_CONFIG.COLOR
  ctx.lineWidth = 1 / viewport.scale

  for (let x = startX; x <= endX; x += gridSize) {
    const isMajor = (x / gridSize) % GRID_CONFIG.MAJOR_INTERVAL === 0
    ctx.strokeStyle = isMajor ? GRID_CONFIG.MAJOR_COLOR : GRID_CONFIG.COLOR

    ctx.beginPath()
    ctx.moveTo(x, startY)
    ctx.lineTo(x, endY)
    ctx.stroke()
  }

  for (let y = startY; y <= endY; y += gridSize) {
    const isMajor = (y / gridSize) % GRID_CONFIG.MAJOR_INTERVAL === 0
    ctx.strokeStyle = isMajor ? GRID_CONFIG.MAJOR_COLOR : GRID_CONFIG.COLOR

    ctx.beginPath()
    ctx.moveTo(startX, y)
    ctx.lineTo(endX, y)
    ctx.stroke()
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getSeatFillColor(seat: Seat): string {
  if (seat.status === 'disabled') {
    return '#F5F5F5'
  }

  if (seat.priceTierColor) {
    return seat.priceTierColor
  }

  if (seat.zoneColor) {
    return hexToRgba(seat.zoneColor, 0.9)
  }

  return '#FFFBE6'
}

function getSeatBorderColor(seat: Seat): string {
  if (seat.status === 'disabled') {
    return '#D9D9D9'
  }

  if (seat.priceTierColor) {
    return darkenByLightness(seat.priceTierColor, 15)
  }

  if (seat.zoneColor) {
    return darkenByLightness(seat.zoneColor, 10)
  }

  return '#D9D9D9'
}

function getTextColor(seat: Seat): string {
  if (seat.status === 'disabled') {
    return '#BFBFBF'
  }

  if (seat.priceTierColor) {
    return getContrastTextColor(seat.priceTierColor)
  }

  if (seat.zoneColor) {
    return getContrastTextColor(seat.zoneColor)
  }

  return '#595959'
}

export function renderSeat(
  ctx: CanvasRenderingContext2D,
  seat: Seat,
  isSelected: boolean = false,
  showLabels: boolean = true,
): void {
  const size = SEAT_CONFIG.SIZE
  const margin = SEAT_CONFIG.MARGIN

  const centerX = seat.x + size / 2
  const centerY = seat.y + size / 2
  const radius = (size - 2 * margin) / 2

  const fillColor = getSeatFillColor(seat)
  const borderColor = getSeatBorderColor(seat)

  ctx.fillStyle = fillColor
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = borderColor
  ctx.lineWidth = SEAT_CONFIG.BORDER_WIDTH
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.stroke()

  if (isSelected) {
    ctx.strokeStyle = SELECTION_COLOR
    ctx.lineWidth = SELECTION_WIDTH
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 1, 0, Math.PI * 2)
    ctx.stroke()
  }

  if (seat.locked) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fill()

    const lockSize = 8
    ctx.strokeStyle = '#ffffff'
    ctx.fillStyle = '#666666'
    ctx.lineWidth = 1.2

    ctx.fillRect(centerX - lockSize / 2, centerY, lockSize, lockSize - 2)

    ctx.beginPath()
    ctx.arc(centerX, centerY - 1, lockSize / 3, Math.PI, 0, true)
    ctx.stroke()
  }

  if (showLabels && !seat.locked) {
    ctx.fillStyle = getTextColor(seat)
    ctx.font = `${SEAT_CONFIG.FONT_SIZE}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const text = `${seat.rowLabel}-${seat.seatLabel}`
    ctx.fillText(text, centerX, centerY)
  }
}

function traceTrapezoidPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const bottomInset = 40
  const topRadius = 2
  const bottomRadius = 80

  const topLeft = { x, y }
  const topRight = { x: x + width, y }
  const bottomRight = { x: x + width - bottomInset, y: y + height }
  const bottomLeft = { x: x + bottomInset, y: y + height }

  ctx.beginPath()
  ctx.moveTo(topLeft.x + topRadius, topLeft.y)

  ctx.lineTo(topRight.x - topRadius, topRight.y)
  ctx.arcTo(topRight.x, topRight.y, bottomRight.x, bottomRight.y, topRadius)
  ctx.arcTo(bottomRight.x, bottomRight.y, bottomLeft.x, bottomLeft.y, bottomRadius)
  ctx.arcTo(bottomLeft.x, bottomLeft.y, topLeft.x, topLeft.y, bottomRadius)
  ctx.arcTo(topLeft.x, topLeft.y, topRight.x, topRight.y, topRadius)

  ctx.closePath()
}

export function renderStage(
  ctx: CanvasRenderingContext2D,
  stage: Stage,
  canvasWidth: number = 1200,
  canvasHeight: number = 700,
  isSelected: boolean = false,
): void {
  const actualWidth = stage.width

  const x = stage.x - actualWidth / 2
  const y = stage.y - stage.height / 2
  const height = stage.height

  ctx.fillStyle = stage.color || '#dedede'

  if (stage.shape === 'rect') {
    ctx.beginPath()
    const rectRadius = 4
    ;(ctx as any).roundRect?.(x, y, actualWidth, height, rectRadius)
    ctx.closePath()
    ctx.fill()
  } else if (stage.shape === 'trapezoid') {
    ctx.save()
    ctx.lineJoin = 'round'
    traceTrapezoidPath(ctx, x, y, actualWidth, height)
    ctx.fill()
    ctx.restore()
  } else if (stage.shape === 'arc') {
    ctx.beginPath()
    const arcRadius = 4
    const controlRadius = height * 0.5

    ctx.moveTo(x + arcRadius, y)

    ctx.lineTo(x + actualWidth - arcRadius, y)
    ctx.arcTo(x + actualWidth, y, x + actualWidth, y + arcRadius, arcRadius)

    ctx.lineTo(x + actualWidth, y + height - controlRadius)
    ctx.arcTo(x + actualWidth, y + height, x + actualWidth / 2, y + height, controlRadius)

    ctx.arcTo(x, y + height, x, y + height - controlRadius, controlRadius)
    ctx.lineTo(x, y + arcRadius)
    ctx.arcTo(x, y, x + arcRadius, y, arcRadius)

    ctx.closePath()
    ctx.fill()
  }

  const stageColor = stage.color || '#dedede'
  ctx.fillStyle = getContrastTextColor(stageColor)
  ctx.font = `bold ${STAGE_CONFIG.FONT_SIZE}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(stage.name, stage.x, stage.y)

  if (isSelected) {
    ctx.save()
    ctx.strokeStyle = SELECTION_COLOR
    ctx.lineWidth = 4

    if (stage.shape === 'rect') {
      const rectRadius = 4
      ctx.beginPath()
      ;(ctx as any).roundRect?.(x, y, actualWidth, height, rectRadius)
      ctx.stroke()
    } else if (stage.shape === 'trapezoid') {
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.miterLimit = 10
      traceTrapezoidPath(ctx, x, y, actualWidth, height)
      ctx.stroke()
    } else if (stage.shape === 'arc') {
      const arcRadius = 4
      const controlRadius = height * 0.5

      ctx.beginPath()
      ctx.moveTo(x + arcRadius, y)
      ctx.lineTo(x + actualWidth - arcRadius, y)
      ctx.arcTo(x + actualWidth, y, x + actualWidth, y + arcRadius, arcRadius)
      ctx.lineTo(x + actualWidth, y + height - controlRadius)
      ctx.arcTo(x + actualWidth, y + height, x + actualWidth / 2, y + height, controlRadius)
      ctx.arcTo(x, y + height, x, y + height - controlRadius, controlRadius)
      ctx.lineTo(x, y + arcRadius)
      ctx.arcTo(x, y, x + arcRadius, y, arcRadius)
      ctx.closePath()
      ctx.stroke()
    }

    ctx.restore()
  }
}

export function getSeatsBounds(seats: Seat[]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
} | null {
  if (seats.length === 0) {
    return null
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  seats.forEach((seat) => {
    minX = Math.min(minX, seat.x)
    minY = Math.min(minY, seat.y)
    maxX = Math.max(maxX, seat.x + SEAT_CONFIG.SIZE)
    maxY = Math.max(maxY, seat.y + SEAT_CONFIG.SIZE)
  })

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export function renderGroupBounds(
  ctx: CanvasRenderingContext2D,
  seats: Seat[],
  scale: number,
): void {
  if (seats.length === 0) return

  const bounds = getSeatsBounds(seats)
  if (!bounds) return

  ctx.save()
  ctx.strokeStyle = 'rgba(24, 144, 255, 0.6)'
  ctx.lineWidth = 1.5 / scale
  ctx.setLineDash([4 / scale, 4 / scale])
  ctx.strokeRect(bounds.minX, bounds.minY, bounds.width, bounds.height)
  ctx.restore()
}

export function renderAllGroupBounds(
  ctx: CanvasRenderingContext2D,
  seats: Seat[],
  scale: number,
): void {
  const groupMap = new Map<string, Seat[]>()

  seats.forEach((seat) => {
    if (seat.groupId) {
      if (!groupMap.has(seat.groupId)) {
        groupMap.set(seat.groupId, [])
      }
      groupMap.get(seat.groupId)!.push(seat)
    }
  })

  groupMap.forEach((groupSeats) => {
    if (groupSeats.length > 1) {
      renderGroupBounds(ctx, groupSeats, scale)
    }
  })
}

export function centerViewportOnSeats(
  seats: Seat[],
  canvasWidth: number,
  canvasHeight: number,
  padding: number = 50,
): CanvasViewport {
  const bounds = getSeatsBounds(seats)

  if (!bounds) {
    return {
      offsetX: 0,
      offsetY: 0,
      scale: 1,
    }
  }

  const scaleX = (canvasWidth - padding * 2) / bounds.width
  const scaleY = (canvasHeight - padding * 2) / bounds.height
  const scale = Math.min(scaleX, scaleY, 2)

  const centerX = bounds.minX + bounds.width / 2
  const centerY = bounds.minY + bounds.height / 2
  const offsetX = canvasWidth / 2 - centerX * scale
  const offsetY = canvasHeight / 2 - centerY * scale

  return {
    offsetX,
    offsetY,
    scale,
  }
}

// @ts-nocheck
/**
 * 座位图编辑器 - 导出工具函数
 *
 * 支持的导出格式：
 * - PNG/JPG 图片
 * - SVG 矢量图
 * - Excel 表格
 * - JSON 数据
 * - PDF 文档
 */

import type { TheaterData, Seat, Stage, Floor } from '../types.simplified'

const sanitizeAscii = (text: string | undefined | null, fallback = ''): string => {
  if (!text) return fallback
  const ascii = String(text).replace(/[^\x20-\x7e]/g, '')
  return ascii || fallback
}

export const exportAsPNG = (canvas: HTMLCanvasElement, filename: string = '座位图'): void => {
  try {
    const dataUrl = canvas.toDataURL('image/png', 1.0)
    downloadFile(dataUrl, `${filename}.png`)
  } catch (error) {
    console.error('导出 PNG 失败:', error)
    throw new Error('导出 PNG 图片失败')
  }
}

export const exportAsJPG = (
  canvas: HTMLCanvasElement,
  filename: string = '座位图',
  quality: number = 0.95,
): void => {
  try {
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    downloadFile(dataUrl, `${filename}.jpg`)
  } catch (error) {
    console.error('导出 JPG 失败:', error)
    throw new Error('导出 JPG 图片失败')
  }
}

export const exportAsSVG = (
  theaterData: TheaterData,
  currentFloorId: string,
  filename: string = '座位图',
): void => {
  try {
    const floor = theaterData.floors.find((f) => f.id === currentFloorId)
    const seats = theaterData.seats.filter((s) => s.floorId === currentFloorId)
    const stage = theaterData.stage

    if (!floor) {
      throw new Error('未找到当前楼层')
    }

    const bounds = calculateBounds(seats, stage ? [stage] : [])
    const padding = 100
    const width = bounds.maxX - bounds.minX + padding * 2
    const height = bounds.maxY - bounds.minY + padding * 2
    const offsetX = -bounds.minX + padding
    const offsetY = -bounds.minY + padding

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect fill="#ffffff" width="${width}" height="${height}"/>
  <text x="${width / 2}" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="#000000">
    ${theaterData.name} - ${floor.name}
  </text>
  ${
    stage
      ? `
  <rect 
    x="${stage.x + offsetX}" 
    y="${stage.y + offsetY}" 
    width="${stage.width}" 
    height="${stage.height}" 
    fill="${stage.color || '#fa8c16'}" 
    stroke="#d46b08" 
    stroke-width="2"
    rx="4"
  />
  <text 
    x="${stage.x + stage.width / 2 + offsetX}" 
    y="${stage.y + stage.height / 2 + offsetY}" 
    text-anchor="middle" 
    dominant-baseline="middle" 
    font-size="16" 
    font-weight="bold" 
    fill="#ffffff"
  >
    ${stage.name}
  </text>`
      : ''
  }
  ${seats
    .map((seat) => {
      const isAvailable = seat.status === 'available'
      const color = isAvailable ? '#1890ff' : '#d9d9d9'
      return `
  <g>
    <circle 
      cx="${seat.x + offsetX}" 
      cy="${seat.y + offsetY}" 
      r="10" 
      fill="${color}" 
      stroke="${isAvailable ? '#096dd9' : '#8c8c8c'}" 
      stroke-width="2"
    />
    <text 
      x="${seat.x + offsetX}" 
      y="${seat.y + offsetY}" 
      text-anchor="middle" 
      dominant-baseline="middle" 
      font-size="10" 
      fill="#ffffff"
    >
      ${seat.rowLabel}-${seat.seatLabel}
    </text>
  </g>`
    })
    .join('')}
  <g transform="translate(20, ${height - 60})">
    <text x="0" y="0" font-size="14" font-weight="bold" fill="#000000">图例：</text>
    <circle cx="10" cy="20" r="8" fill="#1890ff" stroke="#096dd9" stroke-width="2"/>
    <text x="25" y="24" font-size="12" fill="#000000">可用座位</text>
    <circle cx="100" cy="20" r="8" fill="#d9d9d9" stroke="#8c8c8c" stroke-width="2"/>
    <text x="115" y="24" font-size="12" fill="#000000">不可用座位</text>
    <rect x="200" y="12" width="30" height="16" fill="#fa8c16" stroke="#d46b08" stroke-width="2" rx="2"/>
    <text x="235" y="24" font-size="12" fill="#000000">舞台</text>
  </g>
  <text x="${width - 20}" y="${height - 30}" text-anchor="end" font-size="12" fill="#666666">
    总座位数: ${seats.length} | 可用: ${seats.filter((s) => s.status === 'available').length}
  </text>
  <text x="${width - 20}" y="${height - 15}" text-anchor="end" font-size="10" fill="#999999">
    导出时间: ${new Date().toLocaleString('zh-CN')}
  </text>
</svg>`

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    downloadFile(url, `${filename}.svg`)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出 SVG 失败:', error)
    throw new Error('导出 SVG 矢量图失败')
  }
}

export const exportToExcel = async (
  theaterData: TheaterData,
  filename: string = '座位数据',
): Promise<void> => {
  const rows: any[] = []

  const floorMap = new Map<string, Floor>()
  theaterData.floors.forEach((floor) => {
    floorMap.set(floor.id, floor)
  })

  const zoneMap = new Map<string, string>()
  theaterData.zones?.forEach((zone) => {
    const key = `${zone.floorId}-${zone.id}`
    zoneMap.set(key, zone.name)
  })

  theaterData.seats.forEach((seat) => {
    const floor = floorMap.get(seat.floorId)
    const zoneName = zoneMap.get(`${seat.floorId}-${seat.zoneId}`) || ''

    rows.push({
      楼层: floor?.name || '',
      座区: zoneName,
      排号: seat.rowLabel,
      座号: seat.seatLabel,
      状态: seat.status === 'available' ? '可用' : '禁用',
      标签: seat.label || '',
      X坐标: seat.x,
      Y坐标: seat.y,
    })
  })

  const { utils, writeFile } = await import('xlsx')

  const ws = utils.json_to_sheet(rows)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, '座位数据')

  writeFile(wb, `${filename}.xlsx`)
}

export const exportAsJSON = (theaterData: TheaterData, filename: string = '座位数据备份'): void => {
  try {
    const blob = new Blob([JSON.stringify(theaterData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出 JSON 失败:', error)
    throw new Error('导出 JSON 数据失败')
  }
}

export type PDFExportOptions = {
  paperSize?: 'A2' | 'A3' | 'A4'
  orientation?: 'portrait' | 'landscape'
  colorMode?: 'color' | 'grayscale'
  showLegend?: boolean
  showFooter?: boolean
}

export const exportAsPDF = async (
  theaterData: TheaterData,
  canvas: HTMLCanvasElement,
  currentFloorId: string,
  options: PDFExportOptions = {},
): Promise<void> => {
  const {
    paperSize = 'A4',
    orientation = 'landscape',
    colorMode = 'color',
    showLegend = true,
    showFooter = true,
  } = options

  const { jsPDF } = await import('jspdf')

  try {
    const floor = theaterData.floors.find((f) => f.id === currentFloorId)
    const seats = theaterData.seats.filter((s) => s.floorId === currentFloorId)
    const availableSeats = seats.filter((s) => s.status === 'available')

    if (!floor) {
      throw new Error('未找到当前楼层')
    }

    const paperSizes: Record<'A2' | 'A3' | 'A4', { width: number; height: number }> = {
      A2: { width: 420, height: 594 },
      A3: { width: 297, height: 420 },
      A4: { width: 210, height: 297 },
    }

    const paper = paperSizes[paperSize]
    const pageWidth =
      orientation === 'landscape'
        ? Math.max(paper.width, paper.height)
        : Math.min(paper.width, paper.height)
    const pageHeight =
      orientation === 'landscape'
        ? Math.min(paper.width, paper.height)
        : Math.max(paper.width, paper.height)

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: paperSize.toLowerCase(),
    })

    const margin = 15

    let currentY = margin

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(20)
    pdf.setTextColor(0, 0, 0)
    const title = `${sanitizeAscii(theaterData.name, 'Theater')} - Seat Map`
    pdf.text(title, pageWidth / 2, currentY + 5, { align: 'center' })

    currentY += 10
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'normal')
    const subtitle = sanitizeAscii(floor.name, 'Floor')
    pdf.text(subtitle, pageWidth / 2, currentY + 5, { align: 'center' })

    currentY += 8
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.5)
    pdf.line(margin, currentY + 2, pageWidth - margin, currentY + 2)

    currentY += 8

    if (showLegend) {
      pdf.setFontSize(10)
      pdf.setTextColor(80, 80, 80)

      pdf.text('Legend:', margin, currentY)

      pdf.setFillColor(24, 144, 255)
      pdf.setDrawColor(9, 109, 217)
      pdf.circle(margin + 20, currentY - 3, 2.5, 'FD')
      pdf.text('Available seat', margin + 26, currentY)

      pdf.setFillColor(217, 217, 217)
      pdf.setDrawColor(140, 140, 140)
      pdf.circle(margin + 70, currentY - 3, 2.5, 'FD')
      pdf.text('Unavailable seat', margin + 76, currentY)

      pdf.setFillColor(250, 140, 22)
      pdf.setDrawColor(212, 107, 8)
      pdf.rect(margin + 120, currentY - 7, 8, 4, 'FD')
      pdf.text('Stage', margin + 132, currentY)

      currentY += 10
    }

    const contentWidth = pageWidth - margin * 2
    const availableHeight = pageHeight - margin - currentY - (showFooter ? 15 : 0)

    const canvasRatio = canvas.width / canvas.height
    let imgWidth = contentWidth
    let imgHeight = imgWidth / canvasRatio

    if (imgHeight > availableHeight) {
      imgHeight = availableHeight
      imgWidth = imgHeight * canvasRatio
    }

    const imgX = (pageWidth - imgWidth) / 2
    const imgY = currentY

    let dataUrl: string

    if (colorMode === 'grayscale') {
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const ctx = tempCanvas.getContext('2d')

      if (ctx) {
        ctx.drawImage(canvas, 0, 0)
        const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
        const data = imageData.data

        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          data[i] = gray
          data[i + 1] = gray
          data[i + 2] = gray
        }

        ctx.putImageData(imageData, 0, 0)
        dataUrl = tempCanvas.toDataURL('image/png', 1.0)
      } else {
        dataUrl = canvas.toDataURL('image/png', 1.0)
      }
    } else {
      dataUrl = canvas.toDataURL('image/png', 1.0)
    }

    pdf.addImage(dataUrl, 'PNG', imgX, imgY, imgWidth, imgHeight)

    if (showFooter) {
      const availableCount = availableSeats.length
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)

      const statsText = `Total: ${seats.length} | Available: ${availableCount} | Disabled: ${
        seats.length - availableCount
      }`
      pdf.text(statsText, margin, pageHeight - 10)

      const dateText = new Date().toISOString().slice(0, 19).replace('T', ' ')
      pdf.text(`Exported at: ${dateText}`, pageWidth - margin, pageHeight - 10, {
        align: 'right',
      })

      pdf.text('Page 1', pageWidth / 2, pageHeight - 10, { align: 'center' })
    }

    const filename = `${theaterData.name}-${floor.name || '座位图'}`
    pdf.save(`${filename}.pdf`)
  } catch (error) {
    console.error('导出 PDF 失败:', error)
    throw new Error('导出 PDF 文档失败，请确认已安装 jsPDF 库')
  }
}

function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function calculateBounds(
  seats: Seat[],
  stages: Stage[],
): { minX: number; minY: number; maxX: number; maxY: number } {
  if (seats.length === 0 && stages.length === 0) {
    return { minX: 0, minY: 0, maxX: 1000, maxY: 800 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  seats.forEach((seat) => {
    const radius = 10
    minX = Math.min(minX, seat.x - radius)
    minY = Math.min(minY, seat.y - radius)
    maxX = Math.max(maxX, seat.x + radius)
    maxY = Math.max(maxY, seat.y + radius)
  })

  stages.forEach((stage) => {
    minX = Math.min(minX, stage.x)
    minY = Math.min(minY, stage.y)
    maxX = Math.max(maxX, stage.x + stage.width)
    maxY = Math.max(maxY, stage.y + stage.height)
  })

  return { minX, minY, maxX, maxY }
}

function getSeatTypeName(type?: 'standard' | 'vip' | 'couple' | 'wheelchair'): string {
  switch (type) {
    case 'vip':
      return 'VIP座位'
    case 'couple':
      return '情侣座'
    case 'wheelchair':
      return '无障碍座'
    case 'standard':
    default:
      return '普通座位'
  }
}

export const exportAsHighResPNG = (
  canvas: HTMLCanvasElement,
  filename: string = '座位图-高清',
): void => {
  try {
    const tempCanvas = document.createElement('canvas')
    const scale = 2
    tempCanvas.width = canvas.width * scale
    tempCanvas.height = canvas.height * scale

    const ctx = tempCanvas.getContext('2d')
    if (!ctx) {
      throw new Error('无法获取 Canvas 上下文')
    }

    ctx.scale(scale, scale)
    ctx.drawImage(canvas, 0, 0)

    const dataUrl = tempCanvas.toDataURL('image/png', 1.0)
    downloadFile(dataUrl, `${filename}.png`)
  } catch (error) {
    console.error('导出高清 PNG 失败:', error)
    throw new Error('导出高清 PNG 图片失败')
  }
}

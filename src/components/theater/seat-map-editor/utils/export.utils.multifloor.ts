// @ts-nocheck
/**
 * 座位图编辑器 - 多楼层导出工具函数
 * 支持：
 * - PNG 多楼层导出（ZIP 打包）
 * - PDF 多楼层导出（自动分页）
 */

import JSZip from 'jszip'
import { jsPDF } from 'jspdf'
import type { TheaterData } from '../types.simplified'

const sanitizeAscii = (text: string | undefined | null, fallback = ''): string => {
  if (!text) return fallback
  const ascii = String(text).replace(/[^\x20-\x7e]/g, '')
  return ascii || fallback
}

const downloadFile = (url: string, filename: string): void => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportCurrentFloorAsPNG = async (
  canvas: HTMLCanvasElement,
  theaterData: TheaterData,
  currentFloorId: string,
): Promise<void> => {
  try {
    const floor = theaterData.floors.find((f) => f.id === currentFloorId)
    const filename = `${theaterData.name}-${floor?.name || '座位图'}`

    const dataUrl = canvas.toDataURL('image/png', 1.0)
    downloadFile(dataUrl, `${filename}.png`)
  } catch (error) {
    console.error('导出 PNG 失败:', error)
    throw new Error('导出 PNG 图片失败')
  }
}

export const exportAllFloorsAsPNG = async (
  theaterData: TheaterData,
  canvas: HTMLCanvasElement,
  renderFloor: (floorId: string) => Promise<void>,
): Promise<void> => {
  try {
    const zip = new JSZip()
    const imagesFolder = zip.folder('座位图')

    if (!imagesFolder) {
      throw new Error('创建 ZIP 文件夹失败')
    }

    for (const floor of theaterData.floors) {
      await renderFloor(floor.id)
      await new Promise((resolve) => setTimeout(resolve, 100))

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b)
            else reject(new Error('生成图片失败'))
          },
          'image/png',
          1.0,
        )
      })

      imagesFolder.file(`${floor.name}座位图.png`, blob)
    }

    const readme = `座位图导出说明
===================

剧场名称：${theaterData.name}
导出时间：${new Date().toLocaleString('zh-CN')}
楼层数量：${theaterData.floors.length}
总座位数：${theaterData.seats.length}

楼层列表：
${theaterData.floors
  .map((floor, index) => {
    const floorSeats = theaterData.seats.filter((s) => s.floorId === floor.id)
    return `${index + 1}. ${floor.name}：${floorSeats.length} 个座位`
  })
  .join('\n')}

说明：
- 每个楼层对应一张 PNG 图片
- 舞台会在每张图片顶部显示，方便预览
- 图片缩放比例与编辑器中显示一致`

    imagesFolder.file('导出说明.txt', readme)

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    const url = URL.createObjectURL(zipBlob)
    const timestamp = new Date().toISOString().slice(0, 10)
    downloadFile(url, `${theaterData.name}_座位图_${timestamp}.zip`)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出 ZIP 失败:', error)
    throw new Error('导出多楼层 PNG 失败')
  }
}

export const exportCurrentFloorAsPDF = async (
  canvas: HTMLCanvasElement,
  theaterData: TheaterData,
  currentFloorId: string,
  paperSize: 'A2' | 'A3' | 'A4' = 'A4',
  orientation: 'portrait' | 'landscape' = 'landscape',
  colorMode: 'color' | 'grayscale' = 'color',
): Promise<void> => {
  try {
    const floor = theaterData.floors.find((f) => f.id === currentFloorId)
    const floorSeats = theaterData.seats.filter((s) => s.floorId === currentFloorId)
    const availableSeats = floorSeats.filter((s) => s.status === 'available')

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

    pdf.setFontSize(20)
    pdf.setTextColor(0, 0, 0)
    const title = `${sanitizeAscii(theaterData.name, 'Theater')} - Seat Map`
    pdf.text(title, pageWidth / 2, margin + 5, { align: 'center' })

    pdf.setFontSize(14)
    const subtitle = sanitizeAscii(floor?.name, 'Floor')
    pdf.text(subtitle, pageWidth / 2, margin + 12, { align: 'center' })

    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.5)
    pdf.line(margin, margin + 17, pageWidth - margin, margin + 17)

    let imgData = canvas.toDataURL('image/png', 1.0)

    if (colorMode === 'grayscale') {
      imgData = await convertToGrayscale(canvas)
    }

    const canvasRatio = canvas.width / canvas.height
    const contentWidth = pageWidth - margin * 2
    const availableHeight = pageHeight - margin * 2 - 25 - 20
    let imgWidth = contentWidth
    let imgHeight = imgWidth / canvasRatio

    if (imgHeight > availableHeight) {
      imgHeight = availableHeight
      imgWidth = imgHeight * canvasRatio
    }

    const imgX = (pageWidth - imgWidth) / 2
    const imgY = margin + 22

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight)

    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    const statsText = `Total: ${floorSeats.length} | Available: ${availableSeats.length}`
    const dateText = new Date().toISOString().slice(0, 19).replace('T', ' ')
    pdf.text(
      `${statsText} | Exported at: ${dateText}`,
      pageWidth / 2,
      pageHeight - margin + 5,
      { align: 'center' },
    )

    pdf.text('Page 1', pageWidth - margin, pageHeight - margin + 5, { align: 'right' })

    const filename = `${theaterData.name}-${floor?.name || '座位图'}`
    pdf.save(`${filename}.pdf`)
  } catch (error) {
    console.error('导出 PDF 失败:', error)
    throw new Error('导出 PDF 文档失败')
  }
}

export const exportAllFloorsAsPDF = async (
  theaterData: TheaterData,
  canvas: HTMLCanvasElement,
  renderFloor: (floorId: string) => Promise<void>,
  paperSize: 'A2' | 'A3' | 'A4' = 'A4',
  orientation: 'portrait' | 'landscape' = 'landscape',
  colorMode: 'color' | 'grayscale' = 'color',
): Promise<void> => {
  try {
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

    for (let i = 0; i < theaterData.floors.length; i++) {
      const floor = theaterData.floors[i]
      if (!floor) continue
      const floorSeats = theaterData.seats.filter((s) => s.floorId === floor.id)
      const availableSeats = floorSeats.filter((s) => s.status === 'available')

      if (i > 0) {
        pdf.addPage()
      }

      await renderFloor(floor.id)
      await new Promise((resolve) => setTimeout(resolve, 100))

      let imgData = canvas.toDataURL('image/png', 1.0)

      if (colorMode === 'grayscale') {
        imgData = await convertToGrayscale(canvas)
      }

      const canvasRatio = canvas.width / canvas.height
      const contentWidth = pageWidth - margin * 2
      const availableHeight = pageHeight - margin * 2 - 25 - 20
      let imgWidth = contentWidth
      let imgHeight = imgWidth / canvasRatio

      if (imgHeight > availableHeight) {
        imgHeight = availableHeight
        imgWidth = imgHeight * canvasRatio
      }

      const imgX = (pageWidth - imgWidth) / 2
      const imgY = margin + 22

      pdf.setFontSize(20)
      pdf.setTextColor(0, 0, 0)
      const title = `${sanitizeAscii(theaterData.name, 'Theater')} - Seat Map`
      pdf.text(title, pageWidth / 2, margin + 5, { align: 'center' })

      pdf.setFontSize(14)
      const floorLabel = sanitizeAscii(floor.name, `Floor ${i + 1}`)
      const subtitle = `${floorLabel} (${i + 1}/${theaterData.floors.length})`
      pdf.text(subtitle, pageWidth / 2, margin + 12, { align: 'center' })

      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.5)
      pdf.line(margin, margin + 17, pageWidth - margin, margin + 17)

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight)

      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      const statsText = `Total: ${floorSeats.length} | Available: ${availableSeats.length}`
      const dateText = new Date().toISOString().slice(0, 19).replace('T', ' ')
      pdf.text(
        `${statsText} | Exported at: ${dateText}`,
        pageWidth / 2,
        pageHeight - margin + 5,
        { align: 'center' },
      )

      pdf.text(
        `Page ${i + 1} of ${theaterData.floors.length}`,
        pageWidth - margin,
        pageHeight - margin + 5,
        { align: 'right' },
      )
    }

    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `${theaterData.name}_座位图_全部楼层_${timestamp}`
    pdf.save(`${filename}.pdf`)
  } catch (error) {
    console.error('导出多页 PDF 失败:', error)
    throw new Error('导出多楼层 PDF 失败')
  }
}

const convertToGrayscale = async (canvas: HTMLCanvasElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('获取 canvas 上下文失败'))
      return
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
      data[i] = avg
      data[i + 1] = avg
      data[i + 2] = avg
    }

    ctx.putImageData(imageData, 0, 0)
    resolve(canvas.toDataURL('image/png', 1.0))
  })
}

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  FileImageOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  SettingOutlined,
  SaveOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons-vue'
import type { TheaterData, Floor, Seat } from '../types.simplified'
import {
  exportAsSVG,
  exportToExcel,
  exportAsJSON,
  exportAsHighResPNG,
  exportAsPDF,
  type PDFExportOptions,
} from '../utils/export.utils'
import {
  exportCurrentFloorAsPNG,
  exportAllFloorsAsPNG,
  exportCurrentFloorAsPDF,
  exportAllFloorsAsPDF,
} from '../utils/export.utils.multifloor'
import message from 'ant-design-vue/es/message'

const props = defineProps<{
  theaterData: TheaterData
  canvasRef?: HTMLCanvasElement | null
  currentFloorId: string
  renderFloor?: (floorId: string) => Promise<void>
}>()

const exporting = ref(false)
const exportRange = ref<'current' | 'all'>('current')
const pdfPaperSize = ref<'A2' | 'A3' | 'A4'>('A4')
const pdfOrientation = ref<'portrait' | 'landscape'>('landscape')
const pdfColorMode = ref<'color' | 'grayscale'>('color')

const currentFloor = computed<Floor | undefined>(() =>
  props.theaterData.floors.find((f: Floor) => f.id === props.currentFloorId),
)

const floorSeatsCount = computed<number>(() =>
  props.theaterData.seats.filter((s: Seat) => s.floorId === props.currentFloorId).length,
)

const getCanvas = (): HTMLCanvasElement | null => {
  if (props.canvasRef) return props.canvasRef
  const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
  return canvas
}

const handleExportPNG = async () => {
  const canvas = getCanvas()
  if (!canvas) {
    message.error('Canvas 未就绪，请稍后重试')
    return
  }

  try {
    exporting.value = true

    if (exportRange.value === 'current') {
      await exportCurrentFloorAsPNG(canvas, props.theaterData, props.currentFloorId)
      message.success('PNG 图片导出成功')
    } else {
      if (!props.renderFloor) {
        message.error('多楼层导出功能不可用')
        return
      }
      await exportAllFloorsAsPNG(props.theaterData, canvas, props.renderFloor)
      message.success(`已导出 ${props.theaterData.floors.length} 个楼层并打包为 ZIP 文件`)
    }
  } catch (error: any) {
    console.error('导出图片失败:', error)
    message.error(error?.message || '导出图片失败')
  } finally {
    exporting.value = false
  }
}

const handleExportHighResPNG = async () => {
  const canvas = getCanvas()
  if (!canvas) {
    message.error('Canvas 未就绪，请稍后重试')
    return
  }

  try {
    exporting.value = true
    const floor = currentFloor.value
    const filename = `${props.theaterData.name}-${floor?.name || '座位图'}-高清`
    exportAsHighResPNG(canvas, filename)
    message.success('高清 PNG 图片导出成功')
  } catch (error: any) {
    console.error('导出高清图片失败:', error)
    message.error(error?.message || '导出高清图片失败')
  } finally {
    exporting.value = false
  }
}

const handleExportSVG = () => {
  try {
    exporting.value = true
    const floor = currentFloor.value
    const filename = `${props.theaterData.name}-${floor?.name || '座位图'}`
    exportAsSVG(props.theaterData, props.currentFloorId, filename)
    message.success('SVG 矢量图导出成功')
  } catch (error: any) {
    console.error('导出 SVG 失败:', error)
    message.error(error?.message || '导出 SVG 失败')
  } finally {
    exporting.value = false
  }
}

const handleExportExcel = async () => {
  try {
    exporting.value = true
    const filename = `${props.theaterData.name}-座位数据`
    await exportToExcel(props.theaterData, filename)
    message.success('Excel 表格导出成功')
  } catch (error: any) {
    console.error('导出 Excel 失败:', error)
    message.error(error?.message || '导出 Excel 表格失败')
  } finally {
    exporting.value = false
  }
}

const handleExportJSON = () => {
  try {
    exporting.value = true
    const filename = `${props.theaterData.name}-数据备份`
    exportAsJSON(props.theaterData, filename)
    message.success('JSON 数据导出成功')
  } catch (error: any) {
    console.error('导出 JSON 失败:', error)
    message.error(error?.message || '导出 JSON 数据失败')
  } finally {
    exporting.value = false
  }
}

const handleExportPDF = async () => {
  const canvas = getCanvas()
  if (!canvas) {
    message.error('Canvas 未就绪，请稍后重试')
    return
  }

  try {
    exporting.value = true
    const floor = currentFloor.value

    const pdfOptions: PDFExportOptions = {
      paperSize: pdfPaperSize.value,
      orientation: pdfOrientation.value,
      colorMode: pdfColorMode.value,
      showLegend: true,
      showFooter: true,
    }

    if (exportRange.value === 'current') {
      await exportAsPDF(props.theaterData, canvas, props.currentFloorId, pdfOptions)
      message.success('PDF 文档导出成功')
    } else {
      if (!props.renderFloor) {
        message.error('多楼层导出功能不可用')
        return
      }
      await exportAllFloorsAsPDF(
        props.theaterData,
        canvas,
        props.renderFloor,
        pdfPaperSize.value,
        pdfOrientation.value,
        pdfColorMode.value,
      )
      message.success(
        `已导出全部 ${props.theaterData.floors.length} 个楼层的 PDF 文档`,
      )
    }
  } catch (error: any) {
    console.error('导出 PDF 失败:', error)
    message.error(error?.message || '导出 PDF 文档失败')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div>
    <!-- 当前导出信息，与 a 项目对齐 -->
    <a-card
      size="small"
      style="margin-bottom: 16px"
    >
      <a-space
        direction="vertical"
        :size="4"
        style="width: 100%"
      >
        <div>
          <a-typography-text type="secondary">剧场：</a-typography-text>
          <a-typography-text strong>
            {{ props.theaterData.name }}
          </a-typography-text>
        </div>
        <div>
          <a-typography-text type="secondary">楼层：</a-typography-text>
          <a-typography-text strong>
            {{ currentFloor?.name || '-' }}
          </a-typography-text>
        </div>
        <div>
          <a-typography-text type="secondary">座位：</a-typography-text>
          <a-typography-text strong>
            {{ floorSeatsCount }} 个（总计 {{ props.theaterData.seats.length }} 个）
          </a-typography-text>
        </div>
      </a-space>
    </a-card>

    <!-- 快速导出，与 a 项目结构对齐 -->
    <a-card
      title="快速导出"
      :bordered="false"
      style="margin-bottom: 16px"
    >
      <a-space
        direction="vertical"
        :size="16"
        style="width: 100%"
      >
        <div>
          <div style="margin-bottom: 8px">
            <FileImageOutlined style="margin-right: 8px; color: #1890ff" />
            <a-typography-text strong> 导出图片（PNG） </a-typography-text>
          </div>
          <a-typography-text
            type="secondary"
            style="font-size: 12px; display: block; margin-bottom: 8px"
          >
            适合打印、方案评审等场景，支持导出当前楼层或所有楼层（ZIP 打包）。
          </a-typography-text>
          <a-space
            direction="vertical"
            :size="8"
            style="width: 100%"
          >
            <a-radio-group v-model:value="exportRange" size="small">
              <a-radio-button value="current">当前楼层</a-radio-button>
              <a-radio-button value="all">所有楼层</a-radio-button>
            </a-radio-group>
            <a-button
              block
              :loading="exporting"
              @click="handleExportPNG"
            >
              <template #icon>
                <FileImageOutlined />
              </template>
              导出 PNG 图片
            </a-button>
          </a-space>
        </div>

        <a-divider style="margin: 0" />

        <div>
          <div style="margin-bottom: 8px">
            <FilePdfOutlined style="margin-right: 8px; color: #eb2f96" />
            <a-typography-text strong> 导出 PDF 文档 </a-typography-text>
          </div>
          <a-typography-text
            type="secondary"
            style="font-size: 12px; display: block; margin-bottom: 8px"
          >
            支持设置纸张大小、方向和颜色模式，适合打印和归档。
          </a-typography-text>
          <a-space
            direction="vertical"
            :size="8"
            style="width: 100%"
          >
            <a-space :size="8">
              <a-radio-group v-model:value="pdfPaperSize" size="small">
                <a-radio-button value="A2">A2</a-radio-button>
                <a-radio-button value="A3">A3</a-radio-button>
                <a-radio-button value="A4">A4</a-radio-button>
              </a-radio-group>
              <a-radio-group v-model:value="pdfOrientation" size="small">
                <a-radio-button value="landscape">横向</a-radio-button>
                <a-radio-button value="portrait">纵向</a-radio-button>
              </a-radio-group>
              <a-radio-group v-model:value="pdfColorMode" size="small">
                <a-radio-button value="color">彩色</a-radio-button>
                <a-radio-button value="grayscale">灰度</a-radio-button>
              </a-radio-group>
            </a-space>
            <a-radio-group v-model:value="exportRange" size="small">
              <a-radio-button value="current">当前楼层</a-radio-button>
              <a-radio-button value="all">所有楼层</a-radio-button>
            </a-radio-group>
            <a-button
              block
              :loading="exporting"
              @click="handleExportPDF"
            >
              <template #icon>
                <FilePdfOutlined />
              </template>
              导出 PDF 文档
            </a-button>
          </a-space>
        </div>

        <a-divider style="margin: 0" />

        <div>
          <div style="margin-bottom: 8px">
            <FileExcelOutlined style="margin-right: 8px; color: #52c41a" />
            <a-typography-text strong> 导出 Excel 表格 </a-typography-text>
          </div>
          <a-typography-text
            type="secondary"
            style="font-size: 12px; display: block; margin-bottom: 8px"
          >
            适合数据分析、统计报表、系统对接等场景。
          </a-typography-text>
          <a-button
            block
            :loading="exporting"
            @click="handleExportExcel"
          >
            <template #icon>
              <FileExcelOutlined />
            </template>
            导出 Excel 表格
          </a-button>
        </div>

        <div>
          <div style="margin-bottom: 8px">
            <SaveOutlined style="margin-right: 8px; color: #722ed1" />
            <a-typography-text strong> 数据备份 (JSON) </a-typography-text>
          </div>
          <a-typography-text
            type="secondary"
            style="font-size: 12px; display: block; margin-bottom: 8px"
          >
            适合系统备份、数据迁移、版本管理等场景。
          </a-typography-text>
          <a-button
            block
            :loading="exporting"
            @click="handleExportJSON"
          >
            <template #icon>
              <SaveOutlined />
            </template>
            导出 JSON 数据
          </a-button>
        </div>
      </a-space>
    </a-card>

    <a-collapse ghost>
      <a-collapse-panel key="advanced">
        <template #header>
          <a-space>
            <SettingOutlined />
            <a-typography-text strong> 高级选项 </a-typography-text>
            <a-typography-text
              type="secondary"
              style="font-size: 12px"
            >
              （专业用户使用）
            </a-typography-text>
          </a-space>
        </template>

        <a-space
          direction="vertical"
          :size="12"
          style="width: 100%"
        >
          <div>
            <div style="margin-bottom: 8px">
              <FileImageOutlined style="margin-right: 8px" />
              <a-typography-text strong> 高清图片（2x 分辨率） </a-typography-text>
            </div>
            <a-typography-text
              type="secondary"
              style="font-size: 12px; display: block; margin-bottom: 8px"
            >
              适合大屏展示、高质量打印。
            </a-typography-text>
            <a-button
              block
              :loading="exporting"
              @click="handleExportHighResPNG"
            >
              <template #icon>
                <FileImageOutlined />
              </template>
              导出高清 PNG
            </a-button>
          </div>

          <div>
            <div style="margin-bottom: 8px">
              <DownloadOutlined style="margin-right: 8px" />
              <a-typography-text strong> 矢量图 (SVG) </a-typography-text>
            </div>
            <a-typography-text
              type="secondary"
              style="font-size: 12px; display: block; margin-bottom: 8px"
            >
              适合设计师二次编辑、无损缩放。
            </a-typography-text>
            <a-button
              block
              :loading="exporting"
              @click="handleExportSVG"
            >
              <template #icon>
                <DownloadOutlined />
              </template>
              导出 SVG 矢量图
            </a-button>
          </div>
        </a-space>
      </a-collapse-panel>
    </a-collapse>

    <a-alert
      style="margin-top: 16px"
      type="info"
      show-icon
    >
      <template #message>
        <a-space>
          <InfoCircleOutlined />
          <span>导出的文件会自动下载到浏览器的默认下载位置。</span>
        </a-space>
      </template>
    </a-alert>
  </div>
</template>

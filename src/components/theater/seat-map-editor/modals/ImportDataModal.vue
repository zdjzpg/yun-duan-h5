<script setup lang="ts">
import { ref } from 'vue'
import {
  FileExcelOutlined,
  CodeOutlined,
  DownloadOutlined,
  InboxOutlined,
} from '@ant-design/icons-vue'
import type { UploadFile } from 'ant-design-vue'
import message from 'ant-design-vue/es/message'
import * as XLSX from 'xlsx'
import type { TheaterData, Stage } from '../types.simplified'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'import', data: TheaterData): void
}>()

type ImportFormat = 'excel' | 'json'

const GRID_SIZE = 40

const snapToGrid = (value: number): number => {
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

// Excel 模板数据
const EXCEL_TEMPLATE_DATA = [
  {
    楼层: '1层',
    座区: 'VIP区',
    排号: '1',
    座号: '1',
    状态: '可用',
    标签: 'VIP',
    X坐标: '100',
    Y坐标: '100',
  },
  {
    楼层: '1层',
    座区: 'VIP区',
    排号: '1',
    座号: '2',
    状态: '可用',
    标签: 'VIP',
    X坐标: '140',
    Y坐标: '100',
  },
  {
    楼层: '1层',
    座区: '普通区',
    排号: '2',
    座号: '1',
    状态: '可用',
    标签: '-',
    X坐标: '100',
    Y坐标: '150',
  },
  {
    楼层: '1层',
    座区: '普通区',
    排号: '2',
    座号: '2',
    状态: '禁用',
    标签: '-',
    X坐标: '140',
    Y坐标: '150',
  },
  {
    楼层: '1层',
    座区: '普通区',
    排号: '2',
    座号: '3',
    状态: '可用',
    标签: '无障碍',
    X坐标: '180',
    Y坐标: '150',
  },
]

// JSON 模板数据
const JSON_TEMPLATE_DATA: TheaterData = {
  id: 'theater-template',
  name: '示例剧场',
  floors: [
    {
      id: 'floor-1',
      name: '1层',
      level: 1,
    },
  ],
  zones: [
    {
      id: 'zone-1',
      venueId: 'template-venue',
      floorId: 'floor-1',
      name: 'VIP区',
      shortName: 'VIP',
      color: '#ff4d4f',
      order: 1,
    },
    {
      id: 'zone-2',
      venueId: 'template-venue',
      floorId: 'floor-1',
      name: '普通区',
      shortName: '普',
      color: '#1890ff',
      order: 2,
    },
  ],
  seats: [
    {
      id: 'seat-1',
      floorId: 'floor-1',
      zoneId: 'zone-1',
      zoneName: 'VIP区',
      zoneColor: '#ff4d4f',
      rowLabel: '1',
      seatLabel: '1',
      status: 'available',
      label: 'vip',
      x: 100,
      y: 100,
    },
    {
      id: 'seat-2',
      floorId: 'floor-1',
      zoneId: 'zone-1',
      zoneName: 'VIP区',
      zoneColor: '#ff4d4f',
      rowLabel: '1',
      seatLabel: '2',
      status: 'available',
      label: 'vip',
      x: 140,
      y: 100,
    },
    {
      id: 'seat-3',
      floorId: 'floor-1',
      zoneId: 'zone-2',
      zoneName: '普通区',
      zoneColor: '#1890ff',
      rowLabel: '2',
      seatLabel: '1',
      status: 'available',
      x: 100,
      y: 150,
    },
    {
      id: 'seat-4',
      floorId: 'floor-1',
      zoneId: 'zone-2',
      zoneName: '普通区',
      zoneColor: '#1890ff',
      rowLabel: '2',
      seatLabel: '2',
      status: 'disabled',
      disabledReason: 'equipment',
      x: 140,
      y: 150,
    },
    {
      id: 'seat-5',
      floorId: 'floor-1',
      zoneId: 'zone-2',
      zoneName: '普通区',
      zoneColor: '#1890ff',
      rowLabel: '2',
      seatLabel: '3',
      status: 'available',
      label: 'accessible',
      x: 180,
      y: 150,
    },
  ],
  stage: {
    id: 'stage-1',
    x: 0,
    y: 0,
    name: '舞台',
    shape: 'rect',
    width: 320,
    height: 60,
    position: 'top-center',
    color: '#faad14',
  },
}
const selectedFormat = ref<ImportFormat>('excel')
const fileList = ref<UploadFile[]>([])
const uploading = ref(false)

const handleDownloadExcelTemplate = () => {
  try {
    const ws = XLSX.utils.json_to_sheet(EXCEL_TEMPLATE_DATA)
    ;(ws as any)['!cols'] = [
      { wch: 10 },
      { wch: 15 },
      { wch: 8 },
      { wch: 8 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '座位数据')

    const instructionData = [
      ['座位图导入模板使用说明'],
      [''],
      ['字段说明：'],
      ['1. 楼层：楼层名称，例如「1层」「2层」'],
      ['2. 座区：座位区域名称，例如「VIP区」「普通区」'],
      ['3. 排号：座位所在排，例如「1」「2」「A」'],
      ['4. 座号：座位序号，例如「1」「2」'],
      ['5. 状态：可用 / 禁用'],
      ['6. 标签：用于标记特殊座位，例如「无障碍」「VIP」，无则填「-」'],
      ['7. X坐标：座位在画布上的 X 坐标（像素，建议为 10 的倍数）'],
      ['8. Y坐标：座位在画布上的 Y 坐标（像素，建议为 10 的倍数）'],
      [''],
      ['使用建议：'],
      ['- 建议先导出示例数据，再在此基础上修改，避免格式错误'],
      ['- 导入时会覆盖当前所有座位数据，请谨慎操作'],
    ]

    const instructionSheet = XLSX.utils.aoa_to_sheet(instructionData)
    const instructionSheetName = '使用说明'
    XLSX.utils.book_append_sheet(wb, instructionSheet, instructionSheetName)

    XLSX.writeFile(wb, '座位图导入模板.xlsx')
  } catch (error) {
    console.error('生成 Excel 模板失败:', error)
    message.error('生成 Excel 模板失败')
  }
}

const handleDownloadJsonTemplate = () => {
  try {
    const blob = new Blob([JSON.stringify(JSON_TEMPLATE_DATA, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '座位图导入模板.json'
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('生成 JSON 模板失败:', error)
    message.error('生成 JSON 模板失败')
  }
}

const parseExcel = async (file: File): Promise<TheaterData> => {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new Error('Excel 文件中没有可用的工作表')
  }
  const worksheet = workbook.Sheets[sheetName]
  if (!worksheet) {
    throw new Error('无法读取 Excel 工作表')
  }
  const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet as XLSX.WorkSheet)

  const floorsMap = new Map<string, { id: string; name: string; level: number }>()
  const zonesMap = new Map<
    string,
    { id: string; name: string; color: string; floorId: string; order: number }
  >()
  const seats: TheaterData['seats'] = []

  let floorIndex = 1
  let zoneIndex = 1

  json.forEach((row) => {
    const floorName = String(row['楼层'] || '').trim() || '默认楼层'
    const zoneName = String(row['座区'] || '').trim() || '默认座区'
    const rowLabel = String(row['排号'] || '').trim() || '1'
    const seatLabel = String(row['座号'] || '').trim() || '1'
    const statusText = String(row['状态'] || '').trim()
    const labelText = String(row['标签'] || '').trim()
    const x = snapToGrid(Number(row['X坐标'] || 0))
    const y = snapToGrid(Number(row['Y坐标'] || 0))

    if (!floorsMap.has(floorName)) {
      const id = `floor-${floorIndex++}`
      floorsMap.set(floorName, { id, name: floorName, level: floorsMap.size + 1 })
    }

    const floor = floorsMap.get(floorName)!

    const zoneKey = `${floor.id}-${zoneName}`
    if (!zonesMap.has(zoneKey)) {
      const id = `zone-${zoneIndex++}`
      const color = zoneName.includes('VIP') ? '#ff4d4f' : '#1890ff'
      zonesMap.set(zoneKey, {
        id,
        name: zoneName,
        color,
        floorId: floor.id,
        order: zonesMap.size + 1,
      })
    }

    const zone = zonesMap.get(zoneKey)!

    const status: TheaterData['seats'][number]['status'] =
      statusText === '禁用' ? 'disabled' : 'available'

    let label: TheaterData['seats'][number]['label']
    if (labelText === 'VIP') {
      label = 'vip'
    } else if (labelText === '无障碍') {
      label = 'accessible'
    } else {
      label = undefined
    }

    seats.push({
      id: `seat-${seats.length + 1}`,
      floorId: floor.id,
      zoneId: zone.id,
      zoneName: zone.name,
      zoneColor: zone.color,
      rowLabel,
      seatLabel,
      status,
      label,
      x,
      y,
    })
  })

  const floors = Array.from(floorsMap.values())

  const zones = Array.from(zonesMap.values()).map((z) => ({
    id: z.id,
    venueId: 'imported-venue',
    floorId: z.floorId,
    name: z.name,
    shortName: undefined,
    color: z.color,
    order: z.order,
  }))

  const stage: Stage = {
    id: 'stage-1',
    x: 0,
    y: 0,
    name: '舞台',
    shape: 'rect',
    width: 320,
    height: 60,
    position: 'top-center',
    color: '#faad14',
  }

  return {
    id: `theater-${Date.now()}`,
    name: '导入剧场',
    floors,
    seats,
    zones,
    stage,
    metadata: {
      createdAt: new Date().toISOString(),
    },
  }
}
const handleBeforeUpload = (file: UploadFile) => {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
  const isJson = file.name.endsWith('.json')

  if (selectedFormat.value === 'excel' && !isExcel) {
    message.error('请选择 Excel 文件（.xlsx 或 .xls）')
    return false
  }

  if (selectedFormat.value === 'json' && !isJson) {
    message.error('请选择 JSON 文件（.json）')
    return false
  }

  fileList.value = [file]
  return false
}

const handleUpload = async () => {
  if (fileList.value.length === 0) {
    message.warning('请先选择要导入的文件')
    return
  }

  const raw = fileList.value[0].originFileObj as File | undefined
  if (!raw) {
    message.error('无法读取要导入的文件')
    return
  }

  try {
    uploading.value = true

    let data: TheaterData
    if (selectedFormat.value === 'excel') {
      data = await parseExcel(raw)
    } else {
      const text = await raw.text()
      data = JSON.parse(text) as TheaterData
    }

    emit('import', data)
    message.success('座位图导入成功')
    handleClose()
  } catch (error: any) {
    console.error('导入座位图失败:', error)
    message.error(error?.message || '导入座位图失败')
  } finally {
    uploading.value = false
  }
}

const handleClose = () => {
  fileList.value = []
  uploading.value = false
  emit('close')
}
</script>

<template>
  <a-modal
    :open="props.visible"
    title="导入座位图"
    :width="720"
    :footer="null"
    @cancel="handleClose"
  >
    <div style="display: flex; flex-direction: column; gap: 16px">
      <a-alert
        message="请选择导入格式，然后上传文件。Excel 适合批量编辑座位信息，JSON 适合完整配置备份。"
        type="info"
        show-icon
      />

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
        <!-- Excel 导入卡片 -->
        <div
          :style="{
            border:
              selectedFormat === 'excel'
                ? '2px solid var(--color-b5)'
                : '1px solid var(--color-n4)',
            borderRadius: '8px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: selectedFormat === 'excel' ? 'var(--color-b1)' : '#fff',
          }"
          @click="selectedFormat = 'excel'"
        >
          <a-space direction="vertical" :size="12" style="width: 100%">
            <div style="display: flex; align-items: center; gap: 12px">
              <FileExcelOutlined style="font-size: 24px; color: var(--color-g5)" />
              <div>
                <a-typography-title :level="5" style="margin: 0">
                  Excel 表格导入
                </a-typography-title>
                <a-typography-text type="secondary" style="font-size: 13px">
                  简单易用，使用 Excel 编辑座位信息
                </a-typography-text>
              </div>
            </div>

            <a-button size="small" @click.stop="handleDownloadExcelTemplate">
              <template #icon>
                <DownloadOutlined />
              </template>
              下载 Excel 模板
            </a-button>
          </a-space>
        </div>

        <!-- JSON 导入卡片 -->
        <div
          :style="{
            border:
              selectedFormat === 'json' ? '2px solid var(--color-b5)' : '1px solid var(--color-n4)',
            borderRadius: '8px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: selectedFormat === 'json' ? 'var(--color-b1)' : '#fff',
          }"
          @click="selectedFormat = 'json'"
        >
          <a-space direction="vertical" :size="12" style="width: 100%">
            <div style="display: flex; align-items: center; gap: 12px">
              <CodeOutlined style="font-size: 24px; color: var(--color-p5)" />
              <div>
                <a-typography-title :level="5" style="margin: 0">
                  JSON 数据导入
                </a-typography-title>
                <a-typography-text type="secondary" style="font-size: 13px">
                  完整数据备份，包含所有配置
                </a-typography-text>
              </div>
            </div>

            <a-button size="small" @click.stop="handleDownloadJsonTemplate">
              <template #icon>
                <DownloadOutlined />
              </template>
              下载 JSON 模板
            </a-button>
          </a-space>
        </div>
      </div>

      <a-divider style="margin: 0">上传文件</a-divider>

      <template v-if="selectedFormat">
        <a-upload-dragger
          v-model:fileList="fileList"
          name="file"
          :before-upload="handleBeforeUpload"
          :multiple="false"
          :max-count="1"
        >
          <p class="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p class="ant-upload-hint">
            支持格式：{{ selectedFormat === 'excel' ? '.xlsx, .xls' : '.json' }} | 最大文件：10MB
          </p>
        </a-upload-dragger>
      </template>
      <template v-else>
        <div
          style="
            border: 1px dashed var(--color-n4);
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            background-color: var(--color-n1);
          "
        >
          <a-typography-text type="secondary">请先选择导入格式</a-typography-text>
        </div>
      </template>

      <a-alert
        v-if="fileList.length > 0"
        message="导入会覆盖当前的所有座位数据，请确认文件内容正确后再导入。"
        type="warning"
        show-icon
      />
    </div>

    <template #footer>
      <a-button @click="handleClose">取消</a-button>
      <a-button
        type="primary"
        :loading="uploading"
        :disabled="!selectedFormat || fileList.length === 0"
        @click="handleUpload"
      >
        开始导入
      </a-button>
    </template>
  </a-modal>
</template>

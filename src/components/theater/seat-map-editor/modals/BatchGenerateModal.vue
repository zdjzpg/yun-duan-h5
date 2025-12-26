<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { BatchGenerateConfig } from '../types.simplified'
import type { VenueSeatStatus, SeatDisabledReason } from '@/types/theater'

const props = withDefaults(
  defineProps<{
    visible: boolean
    startPosition?: { x: number; y: number }
  }>(),
  {
    visible: false,
  },
)

const emit = defineEmits<{
  (
    e: 'ok',
    config: BatchGenerateConfig & {
      status: VenueSeatStatus
      disabledReason?: SeatDisabledReason
    },
    position: { x: number; y: number },
  ): void
  (e: 'cancel'): void
}>()

type FormModel = BatchGenerateConfig & {
  x: number
  y: number
  status: VenueSeatStatus
  disabledReason?: SeatDisabledReason
}

const createDefaultModel = (startPosition?: { x: number; y: number }): FormModel => ({
  x: startPosition?.x ?? 0,
  y: startPosition?.y ?? 0,
  startRow: 1,
  startSeat: 1,
  rowCount: 10,
  seatsPerRow: 20,
  rowSpacing: 10,
  seatSpacing: 10,
  status: 'available',
  disabledReason: undefined,
})

const formRef = ref()
const isDisabled = ref(false)

const formModel = reactive<FormModel>(createDefaultModel(props.startPosition))

const previewCount = computed(() => {
  const rowCount = Number(formModel.rowCount) || 0
  const seatsPerRow = Number(formModel.seatsPerRow) || 0
  return rowCount * seatsPerRow
})

const DISABLED_REASON_OPTIONS: { label: string; value: SeatDisabledReason }[] = [
  { label: '设备占用', value: 'equipment' },
  { label: '维护中', value: 'maintenance' },
  { label: '其他', value: 'other' },
]

watch(
  () => props.visible,
  (visible) => {
    const form = formRef.value as any
    if (visible) {
      const next = createDefaultModel(props.startPosition)
      Object.assign(formModel, next)
      isDisabled.value = formModel.status === 'disabled'
      if (form?.clearValidate) {
        form.clearValidate()
      }
    } else if (form) {
      form.resetFields()
    }
  },
)

watch(
  () => formModel.status,
  (status) => {
    isDisabled.value = status === 'disabled'
    if (status !== 'disabled') {
      formModel.disabledReason = undefined
    }
  },
  { immediate: true },
)

const handleOk = async () => {
  const form = formRef.value as any
  if (!form) return
  try {
    await form.validateFields()

    const fieldErrors: Array<{ name: string | string[]; errors: string[] }> = []
    if (formModel.rowSpacing % 10 !== 0) {
      fieldErrors.push({
        name: 'rowSpacing',
        errors: ['间距必须是 10 的倍数'],
      })
    }
    if (formModel.seatSpacing % 10 !== 0) {
      fieldErrors.push({
        name: 'seatSpacing',
        errors: ['间距必须是 10 的倍数'],
      })
    }
    if (fieldErrors.length > 0) {
      form.setFields(fieldErrors)
      return
    }

    const { x, y, ...rest } = formModel
    emit('ok', rest, { x, y })

    const next = createDefaultModel(props.startPosition)
    Object.assign(formModel, next)
    isDisabled.value = false
    form.resetFields()
  } catch (error) {
    console.error('批量生成座位表单校验失败:', error)
  }
}

const handleCancel = () => {
  const form = formRef.value as any
  if (form) {
    form.resetFields()
  }
  const next = createDefaultModel(props.startPosition)
  Object.assign(formModel, next)
  isDisabled.value = false
  emit('cancel')
}
</script>

<template>
  <a-modal
    title="批量生成座位"
    :open="props.visible"
    :width="600"
    centered
    ok-text="生成座位"
    cancel-text="取消"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form ref="formRef" layout="vertical" :model="formModel">
      <a-typography-title :level="5">📍 起始位置</a-typography-title>
      <a-typography-text
        type="secondary"
        style="font-size: 12px; display: block; margin-bottom: 12px"
      >
        坐标指的是座位区域的<strong>中心点位置</strong>（0,0 在画布中心）
      </a-typography-text>

      <a-space size="large" style="width: 100%">
        <a-form-item
          label="X 坐标"
          name="x"
          :rules="[{ required: true, message: '请输入 X 坐标' }]"
          style="margin-bottom: 16px"
        >
          <a-input-number
            v-model:value="formModel.x"
            :min="-5000"
            :max="5000"
            placeholder="横向位置"
            style="width: 120px"
          />
        </a-form-item>

        <a-form-item
          label="Y 坐标"
          name="y"
          :rules="[{ required: true, message: '请输入 Y 坐标' }]"
          style="margin-bottom: 16px"
        >
          <a-input-number
            v-model:value="formModel.y"
            :min="-5000"
            :max="5000"
            placeholder="纵向位置"
            style="width: 120px"
          />
        </a-form-item>
      </a-space>

      <a-typography-title :level="5">🔢 编号设置</a-typography-title>

      <a-space size="large" style="width: 100%">
        <a-form-item
          label="起始排号"
          name="startRow"
          :rules="[{ required: true, message: '请输入起始排号' }]"
          style="margin-bottom: 16px"
        >
          <a-input-number
            v-model:value="formModel.startRow"
            :min="1"
            placeholder="例如：1"
            style="width: 120px"
          />
        </a-form-item>

        <a-form-item
          label="起始座号"
          name="startSeat"
          :rules="[{ required: true, message: '请输入起始座号' }]"
          style="margin-bottom: 16px"
        >
          <a-input-number
            v-model:value="formModel.startSeat"
            :min="1"
            placeholder="例如：1"
            style="width: 120px"
          />
        </a-form-item>
      </a-space>

      <a-typography-title :level="5">📐 布局设置</a-typography-title>
      <a-typography-text
        type="secondary"
        style="font-size: 12px; display: block; margin-bottom: 12px"
      >
        使用动态网格系统：网格大小 = 座位大小 + 间距，座位嵌入格子内部，四周留白作为间距
      </a-typography-text>

      <a-space size="large" style="width: 100%">
        <a-form-item
          label="排数"
          name="rowCount"
          :rules="[
            { required: true, message: '请输入排数' },
            { type: 'number', min: 1, max: 100, message: '排数范围: 1-100' },
          ]"
          style="margin-bottom: 16px"
        >
          <a-input-number
            v-model:value="formModel.rowCount"
            :min="1"
            :max="100"
            placeholder="总共多少排"
            style="width: 120px"
          />
        </a-form-item>

        <a-form-item
          label="每排座位数"
          name="seatsPerRow"
          :rules="[
            { required: true, message: '请输入每排座位数' },
            { type: 'number', min: 1, max: 100, message: '座位数范围: 1-100' },
          ]"
          style="margin-bottom: 16px"
        >
          <a-input-number
            v-model:value="formModel.seatsPerRow"
            :min="1"
            :max="100"
            placeholder="每排多少座"
            style="width: 120px"
          />
        </a-form-item>
      </a-space>

      <a-space size="large" style="width: 100%">
        <a-form-item
          label="排间距（像素）"
          name="rowSpacing"
          :rules="[{ required: true, message: '请输入排间距' }]"
          style="margin-bottom: 16px"
        >
          <a-input-number
            v-model:value="formModel.rowSpacing"
            :min="0"
            :max="100"
            :step="10"
            placeholder="排与排之间的距离"
            style="width: 120px"
          />
        </a-form-item>

        <a-form-item
          label="座间距（像素）"
          name="seatSpacing"
          :rules="[{ required: true, message: '请输入座间距' }]"
          style="margin-bottom: 16px"
        >
          <a-input-number
            v-model:value="formModel.seatSpacing"
            :min="0"
            :max="100"
            :step="10"
            placeholder="座位之间的距离"
            style="width: 120px"
          />
        </a-form-item>
      </a-space>

      <a-typography-title :level="5">⚙ 状态设置</a-typography-title>
      <a-typography-text
        type="secondary"
        style="font-size: 12px; display: block; margin-bottom: 12px"
      >
        设置生成座位的初始状态
      </a-typography-text>

      <a-form-item
        label="座位状态"
        name="status"
        :rules="[{ required: true, message: '请选择座位状态' }]"
        style="margin-bottom: 16px"
      >
        <a-radio-group v-model:value="formModel.status">
          <a-radio value="available"> 可用 </a-radio>
          <a-radio value="disabled"> 禁用 </a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item
        v-if="isDisabled"
        label="禁用原因"
        name="disabledReason"
        :rules="[{ required: true, message: '请选择禁用原因' }]"
        style="margin-bottom: 16px"
      >
        <a-radio-group v-model:value="formModel.disabledReason">
          <a-radio
            v-for="option in DISABLED_REASON_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </a-radio>
        </a-radio-group>
      </a-form-item>

      <div
        v-if="previewCount > 0"
        style="
          margin-top: 24px;
          padding: 16px;
          background: #f0f5ff;
          border-radius: 4px;
          border: 1px solid #adc6ff;
        "
      >
        <a-typography-text strong style="color: #1890ff">
          📊 预计生成 {{ previewCount }} 个座位
        </a-typography-text>
      </div>
    </a-form>
  </a-modal>
</template>

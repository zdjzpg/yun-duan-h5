<script setup lang="ts">
import { ref } from 'vue'
import type { Seat } from '../types.simplified'

type RenumberDirection = 'horizontal' | 'vertical'

type RenumberConfig = {
  direction: RenumberDirection
  startRowNumber: number
  startSeatNumber: number
  rowIncrement: number
  seatIncrement: number
}

const props = defineProps<{
  visible: boolean
  seats: Seat[]
}>()

const emit = defineEmits<{
  (e: 'ok', config: RenumberConfig): void
  (e: 'cancel'): void
}>()

const formRef = ref()

const initialValues: RenumberConfig = {
  direction: 'horizontal',
  startRowNumber: 1,
  startSeatNumber: 1,
  rowIncrement: 1,
  seatIncrement: 1,
}

const formState = ref<RenumberConfig>({ ...initialValues })

const handleOk = async () => {
  const form = formRef.value as any
  if (!form) return
  try {
    await form.validateFields()
    const values = formState.value
    emit('ok', { ...values })
    form.resetFields()
    formState.value = { ...initialValues }
  } catch (error) {
    console.error('重新编号表单校验失败:', error)
  }
}

const handleCancel = () => {
  const form = formRef.value as any
  if (form) {
    form.resetFields()
  }
  formState.value = { ...initialValues }
  emit('cancel')
}
</script>

<template>
  <a-modal
    title="批量重新编号"
    :open="props.visible"
    :width="500"
    wrap-class-name="seat-map-renumber-modal"
    centered
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-alert
      :message="`将为选中的 ${props.seats.length} 个座位重新编号`"
      type="info"
      show-icon
      style="margin-bottom: 16px"
    />

    <a-form ref="formRef" layout="vertical" :model="formState" :initial-values="initialValues">
      <a-form-item name="direction" label="编号方向" extra="选择座位编号的主要方向">
        <a-radio-group v-model:value="formState.direction">
          <a-space direction="vertical">
            <a-radio value="horizontal"> 水平优先（从左到右，从上到下） </a-radio>
            <a-radio value="vertical"> 垂直优先（从上到下，从左到右） </a-radio>
          </a-space>
        </a-radio-group>
      </a-form-item>

      <a-form-item
        name="startRowNumber"
        label="起始排号"
        :rules="[{ required: true, message: '请输入起始排号' }]"
      >
        <a-input-number
          v-model:value="formState.startRowNumber"
          :min="1"
          :max="999"
          style="width: 100%"
          placeholder="请输入起始排号"
        />
      </a-form-item>

      <a-form-item
        name="startSeatNumber"
        label="起始座号"
        :rules="[{ required: true, message: '请输入起始座号' }]"
      >
        <a-input-number
          v-model:value="formState.startSeatNumber"
          :min="1"
          :max="999"
          style="width: 100%"
          placeholder="请输入起始座号"
        />
      </a-form-item>

      <a-form-item
        name="rowIncrement"
        label="排号递增"
        extra="每一排的排号递增值"
        :rules="[{ required: true, message: '请输入排号递增值' }]"
      >
        <a-input-number
          v-model:value="formState.rowIncrement"
          :min="1"
          :max="10"
          style="width: 100%"
          placeholder="请输入排号递增值"
        />
      </a-form-item>

      <a-form-item
        name="seatIncrement"
        label="座号递增"
        extra="每一列的座号递增值"
        :rules="[{ required: true, message: '请输入座号递增值' }]"
      >
        <a-input-number
          v-model:value="formState.seatIncrement"
          :min="1"
          :max="10"
          style="width: 100%"
          placeholder="请输入座号递增值"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style>
/* 单独控制批量重新编号弹窗宽度，和 a 项目保持一致 */
.seat-map-renumber-modal .ant-modal {
  width: 500px !important;
  max-width: 500px !important;
}
</style>

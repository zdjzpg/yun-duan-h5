<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Seat, Zone } from '../types.simplified'
import type { VenueSeatStatus, SeatDisabledReason } from '@/types/theater'

const props = defineProps<{
  visible: boolean
  seat?: Seat
  zones: Zone[]
  existingSeats: Seat[]
  defaultZoneId?: string
  defaultPosition?: { x: number; y: number }
}>()

const emit = defineEmits<{
  (
    e: 'ok',
    payload: {
      zoneId?: string
      rowLabel: string
      seatLabel: string
      x: number
      y: number
      status: VenueSeatStatus
      disabledReason?: SeatDisabledReason
    },
  ): void
  (e: 'cancel'): void
}>()

const formRef = ref()
const isDisabled = ref(false)

const DISABLED_REASON_OPTIONS: { label: string; value: SeatDisabledReason }[] = [
  { label: '设备占用', value: 'equipment' },
  { label: '维护中', value: 'maintenance' },
  { label: '其他', value: 'other' },
]

const resetForm = () => {
  const form = formRef.value as any
  if (form) {
    form.resetFields()
  }
  isDisabled.value = false
}

watch(
  () => props.visible,
  (visible) => {
    const form = formRef.value as any
    if (!form) return

    if (visible) {
      if (props.seat) {
        const seat = props.seat
        form.setFieldsValue({
          zoneId: seat.zoneId,
          rowNumber: Number(seat.rowLabel) || 1,
          seatNumber: Number(seat.seatLabel) || 1,
          x: seat.x,
          y: seat.y,
          status: seat.status,
          disabledReason: seat.disabledReason,
        })
        isDisabled.value = seat.status === 'disabled'
      } else {
        form.setFieldsValue({
          zoneId: props.defaultZoneId || props.zones[0]?.id,
          rowNumber: 1,
          seatNumber: 1,
          x: props.defaultPosition?.x ?? 0,
          y: props.defaultPosition?.y ?? 0,
          status: 'available',
          disabledReason: undefined,
        })
        isDisabled.value = false
      }
    } else {
      resetForm()
    }
  },
)

const handleStatusChange = (status: VenueSeatStatus) => {
  isDisabled.value = status === 'disabled'
}

const handleOk = async () => {
  const form = formRef.value as any
  if (!form) return
  try {
    const values = await form.validateFields()
    const rowLabel = String(values.rowNumber)
    const seatLabel = String(values.seatNumber)

    const isDuplicate = (props.existingSeats || []).some((s: Seat) => {
      if (!values.zoneId) return false
      return (
        s.zoneId === values.zoneId &&
        s.rowLabel === rowLabel &&
        s.seatLabel === seatLabel &&
        s.id !== props.seat?.id
      )
    })

    if (isDuplicate) {
      form.setFields([
        {
          name: 'rowNumber',
          errors: ['该座区内已存在相同排号和座号的座位'],
        },
        {
          name: 'seatNumber',
          errors: [''],
        },
      ])
      return
    }

    emit('ok', {
      zoneId: values.zoneId,
      rowLabel,
      seatLabel,
      x: values.x,
      y: values.y,
      status: values.status as VenueSeatStatus,
      disabledReason: values.disabledReason as SeatDisabledReason | undefined,
    })
    resetForm()
  } catch (error) {
    console.error('单个座位表单校验失败:', error)
  }
}

const handleCancel = () => {
  resetForm()
  emit('cancel')
}
</script>

<template>
  <a-modal
    :title="seat ? '编辑座位' : '添加座位'"
    :open="visible"
    width="500"
    centered
    destroy-on-close
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form ref="formRef" layout="vertical" style="margin-top: 16px">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item
            label="排号"
            name="rowNumber"
            :rules="[
              { required: true, message: '请输入排号' },
              { type: 'number', min: 1, message: '排号必须大于 0' },
            ]"
          >
            <a-input-number :min="1" :precision="0" placeholder="1" style="width: 100%" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item
            label="座位号"
            name="seatNumber"
            :rules="[
              { required: true, message: '请输入座位号' },
              { type: 'number', min: 1, message: '座位号必须大于 0' },
            ]"
          >
            <a-input-number :min="1" :precision="0" placeholder="1" style="width: 100%" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item
            label="X 坐标"
            name="x"
            :rules="[{ required: true, message: '请输入 X 坐标' }]"
          >
            <a-input-number :precision="0" placeholder="0" style="width: 100%" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item
            label="Y 坐标"
            name="y"
            :rules="[{ required: true, message: '请输入 Y 坐标' }]"
          >
            <a-input-number :precision="0" placeholder="0" style="width: 100%" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item
        label="座位状态"
        name="status"
        :rules="[{ required: true, message: '请选择座位状态' }]"
      >
        <a-radio-group @change="(e: any) => handleStatusChange(e.target.value)">
          <a-radio value="available"> 可用 </a-radio>
          <a-radio value="disabled"> 禁用 </a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item
        v-if="isDisabled"
        label="禁用原因"
        name="disabledReason"
        :rules="[{ required: true, message: '请选择禁用原因' }]"
      >
        <a-radio-group>
          <a-radio
            v-for="option in DISABLED_REASON_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item label="所属座区" name="zoneId">
        <a-select
          :options="zones.map((z: Zone) => ({ label: z.name, value: z.id }))"
          placeholder="选择座区（可选）"
          allow-clear
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

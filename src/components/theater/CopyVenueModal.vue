<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { InfoCircleOutlined } from '@ant-design/icons-vue'
import message from 'ant-design-vue/es/message'
import type { CopyVenueRequest } from '@/api/endpoints/theater/types'
import { copyVenue } from '@/api/endpoints/theater/venue-lock'

const props = defineProps<{
  sourceVenueId: string
  sourceVenueName: string
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success', newVenueId: string): void
}>()

type FormModel = {
  newVenueName: string
  copySeatData: boolean
}

const formRef = ref()
const formModel = reactive<FormModel>({
  newVenueName: '',
  copySeatData: true,
})
const loading = ref(false)

watch(
  () => props.open,
  (val) => {
    if (val) {
      formModel.newVenueName = props.sourceVenueName
        ? `${props.sourceVenueName} - 副本`
        : ''
      formModel.copySeatData = true
    }
  },
)

const handleClose = () => {
  const form = formRef.value as any
  if (form?.resetFields) {
    form.resetFields()
  }
  emit('close')
}

const handleOk = async () => {
  const form = formRef.value as any
  if (!form) return

  try {
    const values = await form.validate()
    loading.value = true

    const request: CopyVenueRequest = {
      sourceVenueId: props.sourceVenueId,
      newVenueName: values.newVenueName,
      copySeatData: values.copySeatData,
    }

    const res = await copyVenue(request)
    message.success(`场馆复制成功！新场馆 ID：${res.newVenueId}`)
    emit('success', res.newVenueId)
    handleClose()
  } catch (error: any) {
    // 如果是表单校验错误，不弹全局错误
    if (error && error.errorFields) {
      return
    }
    console.error('复制场馆失败:', error)
    message.error('复制场馆失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <a-modal
    title="复制场馆"
    :open="open"
    :confirm-loading="loading"
    centered
    :width="500"
    @ok="handleOk"
    @cancel="handleClose"
  >
    <a-space direction="vertical" :size="16" style="width: 100%">
      <a-alert type="info" show-icon>
        <template #icon>
          <InfoCircleOutlined />
        </template>
        <template #message>
          复制场馆说明
        </template>
        <template #description>
          <a-space direction="vertical" :size="4">
            <div>· 复制将创建一个新的场馆，包含与原场馆相同的基础信息。</div>
            <div>· 可以选择是否复制座位数据（座位坐标、座区、楼层等）。</div>
            <div>· 复制后的场馆不会继承原场馆的订单和演出关联。</div>
          </a-space>
        </template>
      </a-alert>

      <a-form
        ref="formRef"
        :model="formModel"
        layout="vertical"
      >
        <a-form-item
          label="源场馆"
          :tooltip="'要复制的场馆'"
        >
          <a-input :value="sourceVenueName" disabled />
        </a-form-item>

        <a-form-item
          label="新场馆名称"
          name="newVenueName"
          :rules="[
            { required: true, message: '请输入新场馆名称' },
            { min: 2, message: '场馆名称至少 2 个字符' },
            { max: 50, message: '场馆名称最多 50 个字符' },
          ]"
        >
          <a-input
            v-model:value="formModel.newVenueName"
            placeholder="请输入新场馆名称"
          />
        </a-form-item>

        <a-form-item
          name="copySeatData"
          :value-prop-name="'checked'"
        >
          <a-checkbox v-model:checked="formModel.copySeatData">
            复制座位数据（包括座位坐标、座区、楼层等）
          </a-checkbox>
        </a-form-item>
      </a-form>
    </a-space>
  </a-modal>
</template>

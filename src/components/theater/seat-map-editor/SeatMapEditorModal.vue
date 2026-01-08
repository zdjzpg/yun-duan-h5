<script setup lang="ts">
import { computed, ref, createVNode } from 'vue'
import { EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'
import Modal from 'ant-design-vue/es/modal'
import message from 'ant-design-vue/es/message'
import type { TheaterData } from './types.simplified'
import { validateTheaterData } from './utils/validation.utils'
import SeatMapEditor from './SeatMapEditor.vue'

const props = withDefaults(
  defineProps<{
    initialData?: Partial<TheaterData> | any
    buttonText?: string
    buttonType?: 'default' | 'primary' | 'dashed'
    showStats?: boolean
  }>(),
  {
    buttonText: '编辑座位图',
    buttonType: 'dashed',
    showStats: true,
  },
)

const emit = defineEmits<{
  (e: 'change', data: TheaterData): void
}>()

const visible = ref(false)
const loadingEditor = ref(false)
const tempData = ref<TheaterData | undefined>()
const hasUnsavedChanges = ref(false)

const open = () => {
  loadingEditor.value = true
  visible.value = true
  tempData.value = (props.initialData || undefined) as TheaterData | undefined
  hasUnsavedChanges.value = false
}

const closeWithoutSave = () => {
  visible.value = false
  tempData.value = undefined
  hasUnsavedChanges.value = false
}

const handleCancel = () => {
  if (hasUnsavedChanges.value) {
    Modal.confirm({
      title: '有未保存的修改',
      icon: createVNode(ExclamationCircleOutlined),
      content: '座位图编辑器有未保存的修改，关闭后将丢失所有更改，确定要关闭吗？',
      okText: '确定关闭',
      okButtonProps: { danger: true } as any,
      cancelText: '取消',
      centered: true,
      onOk: () => {
        closeWithoutSave()
      },
    } as any)
  } else {
    closeWithoutSave()
  }
}

const handleOk = () => {
  if (!tempData.value) {
    message.warning('没有数据需要保存')
    return
  }

  const validationResult = validateTheaterData(tempData.value)
  if (!validationResult.success) {
    const errors = validationResult.errors || []

    if (errors.length === 1) {
      const first = errors[0]
      if (first) {
        message.error(first.message)
      }
    } else if (errors.length > 1) {
      const content = errors.map((e, idx) => `${idx + 1}. ${e.message}`).join('\n')

      Modal.error({
        title: '座位图数据校验失败',
        content,
        okText: '我知道了',
        centered: true,
      } as any)
    }

    return
  }

  emit('change', tempData.value)
  hasUnsavedChanges.value = false
  visible.value = false
  message.success('座位图保存成功')
}

const handleEditorChange = (data: TheaterData) => {
  tempData.value = data
  hasUnsavedChanges.value = true
}

const stats = computed(() => {
  const data = (tempData.value || (props.initialData as any)) as any
  if (!data || !Array.isArray(data?.seats)) return null

  const totalSeats = data.seats.length
  const availableSeats = data.seats.filter((s: any) => s.status === 'available').length

  return { totalSeats, availableSeats }
})
</script>

<template>
  <a-button
    :type="buttonType"
    block
    size="large"
    class="seat-map-editor-trigger-button"
    @click="open"
  >
    <template #icon>
      <EditOutlined />
    </template>
    <div>
      <div>{{ buttonText }}</div>
      <div v-if="showStats && stats && stats.totalSeats > 0" class="seat-map-editor-stats">
        已设置 {{ stats.totalSeats }} 个座位｜可卖 {{ stats.availableSeats }} 个
      </div>
    </div>
  </a-button>

  <a-modal
    title="座位图编辑器"
    :open="visible"
    :keyboard="false"
    :mask-closable="false"
    width="100%"
    wrap-class-name="seat-map-editor-modal-fullscreen"
    ok-text="完成"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-spin :spinning="loadingEditor">
      <SeatMapEditor
        :initial-data="initialData"
        @change="handleEditorChange"
        @ready="loadingEditor = false"
      />
    </a-spin>
  </a-modal>
</template>

<style>
/* ========================================
   座位图编辑器 - 全屏 Modal 布局
   wrapClassName="seat-map-editor-modal-fullscreen"
   ======================================== */

.seat-map-editor-modal-fullscreen {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  padding: 0 !important;
}
.seat-map-editor-modal-fullscreen .ant-layout {
  height: calc(100vh - 117px) !important;
}
.seat-map-editor-modal-fullscreen .ant-layout-content > div {
  overflow: hidden !important;
}
.seat-map-editor-modal-fullscreen .ant-modal {
  top: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  max-width: 100% !important;
  width: 100% !important;
  height: 100% !important;
}

.seat-map-editor-modal-fullscreen .ant-modal-content {
  border-radius: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  padding: 0 !important;
}

.seat-map-editor-modal-fullscreen .ant-modal-header {
  padding: 16px 16px !important;
  margin-bottom: 0 !important;
  border-bottom: 1px solid #f0f0f0 !important;
}

.seat-map-editor-modal-fullscreen .ant-modal-body {
  flex: 1 !important;
  padding: 0 !important;
  overflow: hidden !important;
  height: calc(100vh - 110px) !important;
}

.seat-map-editor-modal-fullscreen .ant-modal-footer {
  margin-top: 0 !important;
  padding: 16px 16px !important;
}

.seat-map-editor-trigger-button {
  height: 120px !important;
  font-size: 16px;
}

.seat-map-editor-stats {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 8px;
}
</style>

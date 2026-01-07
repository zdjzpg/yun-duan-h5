<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ShowFormDetails } from '../types'

const props = defineProps<{
  modelValue: ShowFormDetails
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ShowFormDetails): void
}>()

const details = computed({
  get: () => props.modelValue,
  set: (val: ShowFormDetails) => emit('update:modelValue', val),
} as any)

const activeKey = ref('intro')

const detailImageList = ref<any[]>([])

watch(
  () => details.value.detailImages,
  (urls) => {
    // 只在本地列表为空时，从表单值同步一次（编辑时回填），避免覆盖正在上传的列表
    if (detailImageList.value.length) return

    if (urls && urls.length) {
      detailImageList.value = urls.map((url: string, index: number) => ({
        uid: `detail-${index}`,
        name: `detail-${index}.jpg`,
        status: 'done',
        url,
      }))
    } else {
      detailImageList.value = []
    }
  },
  { immediate: true },
)

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ;(window as any).message?.error?.('只支持上传图片文件')
    return false
  }

  const validFormats = ['image/jpeg', 'image/png', 'image/gif']
  if (!validFormats.includes(file.type)) {
    ;(window as any).message?.error?.('仅支持 JPG/PNG/GIF 格式的图片')
    return false
  }

  const isLt6M = file.size / 1024 / 1024 < 6
  if (!isLt6M) {
    ;(window as any).message?.error?.('图片大小不能超过 6MB')
    return false
  }

  return true
}

const customRequest = (options: any) => {
  const { file, onSuccess, onError } = options
  const reader = new FileReader()
  reader.onload = () => {
    const base64 = reader.result as string
    try {
      onSuccess({ url: base64 })
    } catch (e) {
      onError?.(e)
    }
  }
  reader.onerror = () => {
    onError?.(new Error('图片读取失败'))
  }
  reader.readAsDataURL(file as File)
}

const handleUploadChange = (info: any) => {
  const fileList = (info.fileList || []).map((file: any) => {
    const url = file.url || file.thumbUrl || file.response?.url
    return url ? { ...file, url } : file
  })

  detailImageList.value = fileList

  const urls = fileList
    .filter((file: any) => file.status === 'done')
    .map((file: any) => file.url)
    .filter((url: any) => !!url) as string[]

  details.value.detailImages = urls.length ? urls : undefined
}
</script>

<template>
  <div>
    <a-tabs v-model:activeKey="activeKey">
      <a-tab-pane key="intro" tab="演出介绍">
        <a-form-item :name="['details', 'intro']" label="演出介绍">
          <a-textarea
            v-model:value="details.intro"
            :rows="6"
            show-count
            :maxlength="2000"
            placeholder="请输入演出介绍"
          />
        </a-form-item>
      </a-tab-pane>

      <a-tab-pane key="bookingRule" tab="预订规则">
        <a-form-item :name="['details', 'bookingRule']" label="预订规则">
          <a-textarea
            v-model:value="details.bookingRule"
            :rows="6"
            show-count
            :maxlength="2000"
            placeholder="请输入预订规则说明"
          />
        </a-form-item>
      </a-tab-pane>

      <a-tab-pane key="refundRule" tab="退改规则">
        <a-form-item :name="['details', 'refundRule']" label="退改规则">
          <a-textarea
            v-model:value="details.refundRule"
            :rows="6"
            show-count
            :maxlength="2000"
            placeholder="请输入退改规则说明"
          />
        </a-form-item>
      </a-tab-pane>

      <a-tab-pane key="safetyNotice" tab="安全须知">
        <a-form-item :name="['details', 'safetyNotice']" label="安全须知">
          <a-textarea
            v-model:value="details.safetyNotice"
            :rows="6"
            show-count
            :maxlength="2000"
            placeholder="请输入安全须知说明"
          />
        </a-form-item>
      </a-tab-pane>

      <a-tab-pane key="detailImages" tab="详情图片">
        <a-alert
          type="warning"
          show-icon
          message="如上传自定义详情图片，则在前端展示中仅显示自定义图片区域，其它文字介绍区域可能不会展示，请将需要说明的内容放入自定义图片中。"
          style="margin-bottom: 16px"
        />

        <a-form-item
          :name="['details', 'detailImages']"
          label="上传图片"
          extra="支持 JPG/PNG/GIF，单张不超过 6MB，建议尺寸不小于 1500px 宽，可拖拽调整顺序"
        >
          <YUploadDraggable
            v-model:fileList="detailImageList"
            :before-upload="beforeUpload"
            :custom-request="customRequest"
            @change="handleUploadChange"
          />
        </a-form-item>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

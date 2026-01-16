<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ShowFormBasicInfo } from '../types'

const props = defineProps<{
  modelValue: ShowFormBasicInfo
  venueOptions: Array<{ label: string; value: string }>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ShowFormBasicInfo): void
}>()

const basicInfo = computed({
  get: () => props.modelValue,
  set: (val: ShowFormBasicInfo) => emit('update:modelValue', val),
} as any)

const coverImageList = ref<any[]>([])

watch(
  () => basicInfo.value.coverImage,
  (urls) => {
    // 只在当前本地列表为空时，从表单值同步一次（用于编辑场景的初始回填）
    if (coverImageList.value.length) return

    if (urls && urls.length) {
      coverImageList.value = urls.map((url: string, index: number) => ({
        uid: `-${index}`,
        name: `cover-${index}.jpg`,
        status: 'done',
        url,
      }))
    } else {
      coverImageList.value = []
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

  const isLt3M = file.size / 1024 / 1024 < 3
  if (!isLt3M) {
    ;(window as any).message?.error?.('图片大小不能超过 3MB')
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

  coverImageList.value = fileList

  const urls = fileList
    .filter((file: any) => file.status === 'done')
    .map((file: any) => file.url)
    .filter((url: any) => !!url) as string[]

  basicInfo.value.coverImage = urls.length ? urls : undefined
}
</script>

<template>
  <div style="max-width: 820px">
    <a-form-item
      :name="['basicInfo', 'name']"
      label="演出名称"
      :rules="[{ required: true, message: '请输入演出名称' }]"
    >
      <a-input v-model:value="basicInfo.name" placeholder="请输入演出名称" :maxlength="50" />
    </a-form-item>

    <a-form-item
      :name="['basicInfo', 'type']"
      label="演出类型"
      :rules="[{ required: true, message: '请选择演出类型' }]"
    >
      <a-select v-model:value="basicInfo.type" placeholder="请选择">
        <a-select-option value="live_show">现场演出</a-select-option>
        <a-select-option value="musical">音乐剧</a-select-option>
        <a-select-option value="drama">话剧</a-select-option>
        <a-select-option value="concert">演唱会</a-select-option>
        <a-select-option value="other">其他</a-select-option>
      </a-select>
    </a-form-item>

    <a-form-item
      :name="['basicInfo', 'coverImage']"
      label="演出图片"
      extra="建议尺寸：封面图 750×750px，详情图 750×375px，支持 JPG/PNG/GIF，单张不超过 3MB，最多 6 张，可拖拽调整顺序"
    >
      <YUploadDraggable
        v-model:fileList="coverImageList"
        :show-cover-badge="true"
        :max-count="6"
        :before-upload="beforeUpload"
        :custom-request="customRequest"
        @change="handleUploadChange"
      />
    </a-form-item>

    <a-form-item :name="['basicInfo', 'description']" label="演出简介">
      <a-textarea
        v-model:value="basicInfo.description"
        placeholder="请输入演出简介"
        :rows="4"
        :maxlength="500"
        show-count
      />
    </a-form-item>

    <a-form-item
      :name="['basicInfo', 'status']"
      label="发布状态"
      :rules="[{ required: true, message: '请选择发布状态' }]"
    >
      <a-radio-group v-model:value="basicInfo.status">
        <a-radio value="on_sale">上架</a-radio>
        <a-radio value="stored">放入仓库</a-radio>
        <a-radio value="off_sale">下架</a-radio>
        <a-radio value="scheduled">定时上下架</a-radio>
      </a-radio-group>
    </a-form-item>

    <a-form-item
      v-if="basicInfo.status === 'scheduled'"
      :name="['basicInfo', 'onlineTimeType']"
      label="上架时间"
      :rules="[{ required: true, message: '请选择上架时间' }]"
    >
      <div class="publish-time-row">
        <a-radio-group v-model:value="basicInfo.onlineTimeType">
          <a-radio value="immediate">立即上架</a-radio>
          <a-radio value="booking_start">第一场次开始自动上架</a-radio>
          <a-radio value="at_time">指定时间开始自动上架</a-radio>
        </a-radio-group>
        <a-date-picker
          v-if="basicInfo.onlineTimeType === 'at_time'"
          v-model:value="basicInfo.onlineTime"
          show-time
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="选择时间"
          style="width: 220px"
        />
      </div>
    </a-form-item>

    <a-form-item
      v-if="basicInfo.status === 'scheduled'"
      :name="['basicInfo', 'offlineTimeType']"
      label="下架时间"
      :rules="[{ required: true, message: '请选择下架时间' }]"
    >
      <div class="publish-time-row">
        <a-radio-group v-model:value="basicInfo.offlineTimeType">
          <a-radio value="booking_end">最后一个场次结束自动下架</a-radio>
          <a-radio value="at_time">指定时间开始自动下架</a-radio>
        </a-radio-group>
        <a-date-picker
          v-if="basicInfo.offlineTimeType === 'at_time'"
          v-model:value="basicInfo.offlineTime"
          show-time
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="选择时间"
          style="width: 220px"
        />
      </div>
    </a-form-item>
  </div>
</template>

<style scoped>
.publish-time-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>

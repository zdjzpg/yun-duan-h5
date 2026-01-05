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
  coverImageList.value = info.fileList
  const urls = info.fileList
    .filter((file: any) => file.status === 'done')
    .map((file: any) => file.url || file.response?.url)
    .filter((url: any) => !!url) as string[]

  basicInfo.value.coverImage = urls.length ? urls : undefined
}
</script>

<template>
  <div style="max-width: 720px">
    <a-form-item
      :name="['basicInfo', 'name']"
      label="演出名称"
      :rules="[{ required: true, message: '请输入演出名称' }]"
    >
      <a-input
        v-model:value="basicInfo.name"
        placeholder="请输入演出名称"
        :maxlength="50"
      />
    </a-form-item>

    <a-form-item
      :name="['basicInfo', 'venueId']"
      label="所属场馆"
      :rules="[{ required: true, message: '请选择所属场馆' }]"
    >
      <a-select
        v-model:value="basicInfo.venueId"
        placeholder="请选择"
        :options="venueOptions"
        show-search
        :filter-option="(input: string, option: any) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        "
      />
    </a-form-item>

    <a-form-item
      :name="['basicInfo', 'type']"
      label="演出类型"
      :rules="[{ required: true, message: '请选择演出类型' }]"
    >
      <a-select v-model:value="basicInfo.type" placeholder="请选择">
        <a-select-option value="live_show">实景演出</a-select-option>
        <a-select-option value="musical">音乐剧</a-select-option>
        <a-select-option value="drama">话剧</a-select-option>
        <a-select-option value="concert">演唱会</a-select-option>
        <a-select-option value="other">其他</a-select-option>
      </a-select>
    </a-form-item>

    <a-form-item :name="['basicInfo', 'suitableAudience']" label="适合人群">
      <a-select
        v-model:value="basicInfo.suitableAudience"
        mode="multiple"
        placeholder="请选择"
      >
        <a-select-option value="children">儿童</a-select-option>
        <a-select-option value="teenager">青少年</a-select-option>
        <a-select-option value="adult">成人</a-select-option>
        <a-select-option value="elderly">老年人</a-select-option>
        <a-select-option value="all_ages">全年龄</a-select-option>
      </a-select>
    </a-form-item>

    <a-form-item
      :name="['basicInfo', 'coverImage']"
      label="封面图"
      extra="建议尺寸 1350×750px，支持 JPG/PNG/GIF，最大 3MB，最多 6 张，可拖拽调整顺序"
    >
      <a-upload
        v-model:file-list="coverImageList"
        list-type="picture-card"
        :before-upload="beforeUpload"
        :custom-request="customRequest"
        @change="handleUploadChange"
      >
        <div v-if="coverImageList.length < 6">
          <span>上传</span>
        </div>
      </a-upload>
    </a-form-item>

    <a-form-item :name="['basicInfo', 'subtitle']" label="副标题">
      <a-input
        v-model:value="basicInfo.subtitle"
        placeholder="请输入副标题"
        :maxlength="100"
      />
    </a-form-item>

    <a-form-item :name="['basicInfo', 'description']" label="演出简介">
      <a-textarea
        v-model:value="basicInfo.description"
        placeholder="简要描述演出内容、特色、亮点等"
        :rows="4"
        :maxlength="1000"
        show-count
      />
    </a-form-item>

    <a-form-item :name="['basicInfo', 'producer']" label="主办方">
      <a-input
        v-model:value="basicInfo.producer"
        placeholder="请输入主办方"
        :maxlength="100"
      />
    </a-form-item>

    <a-form-item
      :name="['basicInfo', 'status']"
      label="初始状态"
      :rules="[{ required: true, message: '请选择初始状态' }]"
    >
      <a-radio-group v-model:value="basicInfo.status">
        <a-radio value="draft">草稿</a-radio>
        <a-radio value="on_sale">立即上架</a-radio>
      </a-radio-group>
    </a-form-item>
  </div>
</template>

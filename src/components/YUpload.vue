<script lang="ts" setup>
import { ref, watch } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { UploadFile } from 'ant-design-vue'

interface Props {
  fileList?: UploadFile[]
  disabled?: boolean
  maxCount?: number
  // 是否显示 antd 自带的列表；默认显示，并使用自定义 itemRender
  showUploadList?: any
}

const props = withDefaults(defineProps<Props>(), {
  fileList: () => [],
  disabled: false,
  maxCount: Infinity,
  showUploadList: () => ({ showPreviewIcon: false, showRemoveIcon: false }),
})

const emit = defineEmits<{
  (e: 'update:fileList', value: UploadFile[]): void
  (e: 'change', info: unknown): void
}>()

const innerFileList = ref<UploadFile[]>([...props.fileList])

watch(
  () => props.fileList,
  (val) => {
    innerFileList.value = [...(val ?? [])]
  },
  { deep: true },
)

watch(
  innerFileList,
  (val) => {
    emit('update:fileList', [...val])
  },
  { deep: true },
)

const fakePercents = ref<Record<string, number>>({})

const getDisplayPercent = (file: UploadFile) => {
  if (typeof file.percent === 'number' && file.percent > 0) {
    return Math.round(file.percent)
  }

  const uid = file.uid as string
  if (!fakePercents.value[uid]) {
    // 进度未知时，给一个 20–60 的随机起始值，让视觉上有“正在上传”的感觉
    fakePercents.value[uid] = 20 + Math.round(Math.random() * 40)
  }
  return fakePercents.value[uid]
}

const handleChange = (info: unknown) => {
  emit('change', info)
}
</script>

<template>
  <a-upload
    v-model:fileList="innerFileList"
    list-type="picture-card"
    :disabled="disabled"
    :max-count="maxCount"
    :show-upload-list="showUploadList"
    v-bind="$attrs"
    @change="handleChange"
  >
    <template #itemRender="{ file, actions }">
      <div class="y-upload-card">
        <template v-if="file.url || file.thumbUrl">
          <img :src="file.url || file.thumbUrl" alt="" />
        </template>
        <template v-else>
          <div class="y-upload-placeholder">
            <a-progress
              v-if="file.status === 'uploading'"
              :showInfo="false"
              :width="40"
              :percent="getDisplayPercent(file)"
            />
            <span v-else>预览生成中</span>
          </div>
        </template>

        <button class="y-upload-remove" @click.stop="actions.remove">
          <i class="iconfont">&#xe60a;</i>
        </button>
      </div>
    </template>

    <template #default>
      <div v-if="innerFileList.length < maxCount && !disabled" class="y-upload-add">
        <PlusOutlined />
      </div>
    </template>
  </a-upload>
</template>

<style scoped lang="less">
.y-upload-card {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 2px;

  &:hover {
    .y-upload-remove {
      display: flex;
    }
  }
}

.y-upload-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.y-upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  color: #999;
  font-size: 12px;
}

.y-upload-remove {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  padding: 0;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 111;
  i {
    font-size: 12px;
  }
}

.y-upload-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  color: #999;
}

.y-upload-text {
  margin-top: 8px;
  font-size: 12px;
}
</style>

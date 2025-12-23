<script lang="ts" setup>
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import type { UploadFile } from 'ant-design-vue'
import YUpload from './YUpload.vue'

interface Props {
  fileList?: UploadFile[]
  disabled?: boolean
  maxCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  fileList: () => [],
  disabled: false,
  maxCount: Infinity,
})

const emit = defineEmits<{
  (e: 'update:fileList', value: UploadFile[]): void
  (e: 'change', info: unknown): void
}>()

const innerFileList = ref<UploadFile[]>([...props.fileList])
const fakePercents = ref<Record<string, number>>({})

watch(
  () => props.fileList,
  (val: UploadFile[] | undefined) => {
    innerFileList.value = [...(val ?? [])]
  },
  { deep: true },
)

watch(
  innerFileList,
  (val: UploadFile[]) => {
    emit('update:fileList', [...val])
  },
  { deep: true },
)

const handleUploadChange = (info: unknown) => {
  emit('change', info)
}

const handleRemove = (file: UploadFile) => {
  if (props.disabled) return
  innerFileList.value = innerFileList.value.filter(
    (item: UploadFile) => item.uid !== file.uid,
  )
}

const getDisplayPercent = (file: UploadFile) => {
  if (typeof file.percent === 'number' && file.percent > 0) {
    return Math.round(file.percent)
  }

  const uid = file.uid as string
  if (!fakePercents.value[uid]) {
    // 进度未知时，给一个 20~60 的随机初始值
    fakePercents.value[uid] = 20 + Math.round(Math.random() * 40)
  }
  return fakePercents.value[uid]
}
</script>

<template>
  <div class="y-upload-draggable">
    <draggable
      v-model="innerFileList"
      item-key="uid"
      class="y-upload-draggable-list"
      ghost-class="y-upload-draggable-ghost"
      :disabled="disabled"
    >
      <!-- 已上传文件：支持拖拽和删除 -->
      <template #item="{ element }">
        <div class="y-upload-card">
          <template v-if="element.url || element.thumbUrl">
            <img :src="element.url || element.thumbUrl" alt="" />
          </template>
          <template v-else>
            <div class="y-upload-placeholder">
              <a-progress
                v-if="element.status === 'uploading'"
                :width="40"
                :percent="getDisplayPercent(element)"
                :showInfo="false"
              />
              <span v-else>预览生成中</span>
            </div>
          </template>
          <button class="y-upload-remove" @click.stop="handleRemove(element)">
            <i class="iconfont">&#xe60a;</i>
          </button>
        </div>
      </template>

      <!-- 上传按钮：始终在最后一项 -->
      <template #footer>
        <YUpload
          v-if="innerFileList.length < maxCount"
          v-model:fileList="innerFileList"
          :disabled="disabled"
          :max-count="maxCount"
          :show-upload-list="false"
          v-bind="$attrs"
          @change="handleUploadChange"
        />
      </template>
    </draggable>
  </div>
</template>

<style scoped lang="less">
.y-upload-draggable {
  display: inline-block;
}

.y-upload-draggable-list {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: flex-start;
}

/* 让 YUpload 在拖拽列表中按内容宽度收缩，并与图片卡片在同一行显示 */
.y-upload-draggable :deep(.ant-upload-wrapper),
.y-upload-draggable :deep(.ant-upload),
.y-upload-draggable :deep(.ant-upload-list-picture-card-container) {
  display: inline-block;
  width: auto;
  margin: 0;
  padding: 0;
  vertical-align: top;
}

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

.y-upload-draggable-ghost {
  opacity: 0.5;
}
</style>

<script lang="ts" setup>
import { ref, watch, computed, onMounted } from 'vue'
import draggable from 'vuedraggable'
import type { UploadFile } from 'ant-design-vue'
import YUpload from './YUpload.vue'

interface Props {
  fileList?: UploadFile[]
  disabled?: boolean
  maxCount?: number
  /** 是否在第一个图片卡片上展示“封面”标记 */
  showCoverBadge?: boolean
  /** 自定义封面标记文案 */
  coverBadgeText?: string
}

const props = withDefaults(defineProps<Props>(), {
  fileList: () => [],
  disabled: false,
  maxCount: Infinity,
  showCoverBadge: false,
  coverBadgeText: '封面',
})

const emit = defineEmits<{
  (e: 'update:fileList', value: UploadFile[]): void
  (e: 'change', info: unknown): void
}>()

const innerFileList = ref<UploadFile[]>([...(props.fileList ?? [])])
const fakePercents = ref<Record<string, number>>({})
const wrapperRef = ref<HTMLElement | null>(null)

// å½“å­˜åœ¨ status === 'done' çš„æ–‡ä»¶æ—¶ï¼Œè¡¨ç¤ºå·²æœ‰å›¾ç‰‡ä¸Šä¼ å®Œæ¯•ï¼Œæœ‰æ„ä¹‰å¼€å?¨æ‹–æ‹½æŽ’åº
const hasDraggableItems = computed(() =>
  innerFileList.value.some((file: UploadFile) => file.status === 'done'),
)

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
  innerFileList.value = innerFileList.value.filter((item: UploadFile) => item.uid !== file.uid)
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

onMounted(() => {
  const el = wrapperRef.value
  if (!el) return
  const controlContent = el.closest('.ant-form-item-control-input-content') as HTMLElement | null
  if (!controlContent) return
  controlContent.style.paddingTop = '0px'
  controlContent.style.paddingBottom = '0px'
})
</script>

<template>
  <div ref="wrapperRef" class="y-upload-draggable">
    <!-- 文件列表为空时，直接用 YUpload，行为与单独使用 YUpload 保持一致 -->
    <YUpload
      v-if="!hasDraggableItems"
      v-model:fileList="innerFileList"
      :disabled="disabled"
      :max-count="maxCount"
      :show-upload-list="false"
      v-bind="$attrs"
      @change="handleUploadChange"
    />

    <!-- 有文件时才启用拖拽排序 -->
    <draggable
      v-else
      v-model="innerFileList"
      item-key="uid"
      class="y-upload-draggable-list"
      ghost-class="y-upload-draggable-ghost"
      :disabled="disabled"
    >
      <!-- 已上传文件：支持拖拽和删除 -->
      <template #item="{ element, index }">
        <div class="y-upload-card">
          <div v-if="props.showCoverBadge && index === 0" class="y-upload-cover-badge">
            <span class="y-upload-cover-star">*</span>
            <span class="y-upload-cover-text">
              {{ props.coverBadgeText }}
            </span>
          </div>
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
.y-upload-draggable :deep(.ant-upload-wrapper.ant-upload-picture-card-wrapper) {
  line-height: 0; // 去掉多余行高
}

.y-upload-draggable :deep(.ant-upload.ant-upload-select-picture-card) {
  width: 80px;
  height: 80px;
  margin: 0; // 避免额外上下间距
  padding: 0;
}
.y-upload-cover-badge {
  position: absolute;
  left: 0;
  top: 0;
  width: fit-content;
  box-sizing: border-box;
  padding: 0 8px;
  height: 22px;
  line-height: 22px;
  display: flex;
  align-items: center;
  font-size: 14px;
  background-color: #bfbfbf;
  z-index: 120;
}

.y-upload-cover-star {
  color: #f5222d;
  margin-right: 4px;
}

.y-upload-cover-text {
  color: #ffffff;
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

<style lang="less">
/* 只在 form-item 的控件区域里包含 YUploadDraggable 时，把这行的上下 padding 关掉，避免高度被撑到 96px */
.ant-form-item-control-input-content:has(> .y-upload-draggable) {
  padding-top: 0;
  padding-bottom: 0;
}
</style>

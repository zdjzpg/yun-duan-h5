<script setup lang="ts">
import { computed } from 'vue'
import { QuestionCircleOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  statistics: {
    floorCount: number
    totalSeats: number
    availableSeats: number
    unavailableSeats: number
    selectedCount: number
    zoneCount: number
  }
  currentFloorName?: string
  zoomLevel?: number
  hoveredSeatStatusText?: string
}>()

const emit = defineEmits<{
  (e: 'showShortcuts'): void
}>()

const isMac = computed(
  () =>
    typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().includes('MAC'),
)

const modKey = computed(() => (isMac.value ? '⌘' : 'Ctrl'))

const handleShowShortcuts = () => {
  emit('showShortcuts')
}
</script>

<template>
  <div
    style="
      height: 40px;
      background: #fafafa;
      border-top: 1px solid #f0f0f0;
      display: flex;
      align-items: center;
      padding: 0 16px;
      font-size: 12px;
      gap: 16px;
    "
  >
    <!-- 左侧：座位统计 -->
    <a-space>
      <!-- 总座位 -->
      <a-tooltip title="座位总数">
        <a-typography-text style="font-size: 12px; color: #262626">
          总座位：
          <a-typography-text strong style="color: #1890ff">
            {{ statistics.totalSeats }}
          </a-typography-text>
        </a-typography-text>
      </a-tooltip>

      <a-divider type="vertical" style="margin: 0 8px; height: 16px" />

      <!-- 可用 -->
      <a-tooltip title="可用座位数">
        <a-typography-text style="font-size: 12px; color: #262626">
          可用：
          <a-typography-text strong style="color: #52c41a">
            {{ statistics.availableSeats }}
          </a-typography-text>
        </a-typography-text>
      </a-tooltip>

      <a-divider type="vertical" style="margin: 0 8px; height: 16px" />

      <!-- 禁用 -->
      <a-tooltip title="禁用座位数">
        <a-typography-text style="font-size: 12px; color: #262626">
          禁用：
          <a-typography-text strong style="color: #ff4d4f">
            {{ statistics.unavailableSeats }}
          </a-typography-text>
          <span v-if="hoveredSeatStatusText" style="margin-left: 4px; color: #8c8c8c">
            （{{ hoveredSeatStatusText }}）
          </span>
        </a-typography-text>
      </a-tooltip>

      <template v-if="statistics.selectedCount > 0">
        <a-divider type="vertical" style="margin: 0 8px; height: 16px" />

        <!-- 选中数量 -->
        <a-tooltip title="当前选中座位数">
          <a-typography-text style="font-size: 12px; color: #262626">
            选中：
            <a-typography-text strong style="color: #fa8c16">
              {{ statistics.selectedCount }}
            </a-typography-text>
          </a-typography-text>
        </a-tooltip>
      </template>
    </a-space>

    <div style="flex: 1" />

    <!-- 中右：缩放状态 -->
    <a-tooltip title="当前缩放级别">
      <a-typography-text style="font-size: 12px; color: #8c8c8c">
        缩放：
        <a-typography-text strong>
          {{ zoomLevel ?? 100 }}%
        </a-typography-text>
      </a-typography-text>
    </a-tooltip>

    <!-- 右侧：操作提示 -->
    <a-space style="margin-left: 16px">
      <a-tooltip :title="`按住 ${modKey} 键并滚动鼠标滚轮缩放画布`">
        <a-typography-text style="font-size: 12px; color: #8c8c8c">
          {{ modKey }}+滚轮缩放
        </a-typography-text>
      </a-tooltip>

      <span style="color: #d9d9d9">|</span>

      <a-tooltip title="按住空格键并拖动画布进行平移">
        <a-typography-text style="font-size: 12px; color: #8c8c8c">
          空格+拖拽
        </a-typography-text>
      </a-tooltip>

      <span style="color: #d9d9d9">|</span>

      <a-tooltip title="右键点击画布打开快捷菜单">
        <a-typography-text style="font-size: 12px; color: #8c8c8c">
          右键菜单
        </a-typography-text>
      </a-tooltip>
    </a-space>

    <!-- 最右：快捷键按钮 -->
    <a-tooltip title="查看完整快捷键列表">
      <a-button
        type="text"
        size="small"
        @click="handleShowShortcuts"
        style="font-size: 16px; color: #8c8c8c; padding: 4px 8px; height: auto"
      >
        <QuestionCircleOutlined />
      </a-button>
    </a-tooltip>
  </div>
</template>

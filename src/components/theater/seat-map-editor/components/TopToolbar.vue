<script setup lang="ts">
import {
  UndoOutlined,
  RedoOutlined,
  ExportOutlined,
  ImportOutlined,
  QuestionCircleOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  PlusOutlined,
  StarOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons-vue'

const props = withDefaults(
  defineProps<{
    theaterName?: string
    canUndo?: boolean
    canRedo?: boolean
    isFullscreen?: boolean
    showSeatLabels: boolean
    zoomLevel: number
  }>(),
  {
    theaterName: '座位图编辑器',
    canUndo: false,
    canRedo: false,
    isFullscreen: false,
  },
)

const emit = defineEmits<{
  (e: 'import'): void
  (e: 'export'): void
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'showShortcuts'): void
  (e: 'toggleFullscreen'): void
  (e: 'batchGenerate'): void
  (e: 'addStage'): void
  (e: 'toggleSeatLabels', checked: boolean): void
  (e: 'zoomIn'): void
  (e: 'zoomOut'): void
  (e: 'zoomChange', value: number): void
}>()

const zoomOptions = [
  { label: '50%', value: 50 },
  { label: '75%', value: 75 },
  { label: '100%', value: 100 },
  { label: '125%', value: 125 },
  { label: '150%', value: 150 },
  { label: '200%', value: 200 },
]
</script>

<template>
  <div style="display: flex; align-items: center; gap: 16px; height: 100%">
    <!-- 左侧：剧场名称 -->
    <div style="flex: 1; display: flex; justify-content: flex-start">
      <a-typography-text strong style="font-size: 16px">
        🏛️ {{ props.theaterName }}
      </a-typography-text>
    </div>

    <!-- 中间：画布工具栏 -->
    <div style="flex: 0 0 auto; display: flex; justify-content: center">
      <a-space size="small">
        <!-- 生成座位 -->
        <a-tooltip title="快速生成网格座位">
          <a-button type="primary" @click="emit('batchGenerate')">
            <template #icon>
              <PlusOutlined />
            </template>
            生成座位
          </a-button>
        </a-tooltip>

        <!-- 添加舞台 -->
        <a-tooltip title="在画布中添加舞台">
          <a-button
            :style="{
              background: '#722ED1',
              border: 'none',
              color: '#ffffff',
            }"
            @click="emit('addStage')"
          >
            <template #icon>
              <StarOutlined />
            </template>
            添加舞台
          </a-button>
        </a-tooltip>

        <a-divider type="vertical" :style="{ margin: 0, height: '24px' }" />

        <!-- 座位编号开关 -->
        <a-tooltip :title="props.showSeatLabels ? '隐藏座位编号' : '显示座位编号'">
          <a-switch
            :checked="props.showSeatLabels"
            @change="(checked: boolean) => emit('toggleSeatLabels', checked)"
          />
        </a-tooltip>

        <a-divider type="vertical" :style="{ margin: 0, height: '24px' }" />

        <!-- 缩小 -->
        <a-tooltip title="缩小">
          <a-button size="small" :disabled="props.zoomLevel <= 50" @click="emit('zoomOut')">
            <template #icon>
              <ZoomOutOutlined />
            </template>
          </a-button>
        </a-tooltip>

        <!-- 缩放选择 -->
        <a-select
          :value="props.zoomLevel"
          size="small"
          style="width: 80px"
          :options="zoomOptions"
          @change="(val: number) => emit('zoomChange', val)"
        />

        <!-- 放大 -->
        <a-tooltip title="放大">
          <a-button size="small" :disabled="props.zoomLevel >= 200" @click="emit('zoomIn')">
            <template #icon>
              <ZoomInOutlined />
            </template>
          </a-button>
        </a-tooltip>
      </a-space>
    </div>

    <!-- 右侧：全局操作 -->
    <div style="flex: 1; display: flex; justify-content: flex-end">
      <a-space size="small">
        <!-- 撤销 -->
        <a-tooltip title="撤销 (Ctrl+Z)">
          <a-button :disabled="!props.canUndo" @click="emit('undo')">
            <template #icon>
              <UndoOutlined />
            </template>
            撤销
          </a-button>
        </a-tooltip>

        <!-- 重做 -->
        <a-tooltip title="重做 (Ctrl+Shift+Z)">
          <a-button :disabled="!props.canRedo" @click="emit('redo')">
            <template #icon>
              <RedoOutlined />
            </template>
            重做
          </a-button>
        </a-tooltip>

        <!-- 导入 -->
        <a-button @click="emit('import')">
          <template #icon>
            <ImportOutlined />
          </template>
          导入
        </a-button>

        <!-- 导出 -->
        <a-button @click="emit('export')">
          <template #icon>
            <ExportOutlined />
          </template>
          导出
        </a-button>

        <!-- 全屏切换 -->
        <a-tooltip
          :title="props.isFullscreen ? '退出全屏 (Ctrl+\\\\ 或 Esc)' : '全屏模式 (Ctrl+\\\\)'"
        >
          <a-button
            :type="props.isFullscreen ? 'primary' : 'default'"
            @click="emit('toggleFullscreen')"
          >
            <template #icon>
              <component :is="props.isFullscreen ? FullscreenExitOutlined : FullscreenOutlined" />
            </template>
            {{ props.isFullscreen ? '退出全屏' : '全屏' }}
          </a-button>
        </a-tooltip>

        <!-- 快捷键 -->
        <a-tooltip title="快捷键说明 (?)">
          <a-button @click="emit('showShortcuts')">
            <template #icon>
              <QuestionCircleOutlined />
            </template>
            快捷键
          </a-button>
        </a-tooltip>
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DeleteOutlined } from '@ant-design/icons-vue'
import type { Stage } from '../types.simplified'

const props = defineProps<{
  selectedStage?: Stage
  stage?: Stage
}>()

const emit = defineEmits<{
  (e: 'updateStage', stageId: string, updates: Partial<Stage>): void
  (e: 'deleteStage', stageId: string): void
  (e: 'addStage'): void
}>()

const SHAPE_OPTIONS = [
  { label: '梯形', value: 'trapezoid' },
  { label: '矩形', value: 'rect' },
  { label: '弧形', value: 'arc' },
]

const PRESET_COLORS = [
  '#dedede',
  '#7ad9ff',
  '#b5f5ec',
  '#efdbff',
  '#ffd6e7',
  '#b0e5b7',
  '#d6e4ff',
  '#fff1b8',
]

const handleUpdate = (updates: Partial<Stage>) => {
  if (props.selectedStage) {
    emit('updateStage', props.selectedStage.id, updates)
  }
}

const handleDelete = () => {
  if (props.selectedStage) {
    emit('deleteStage', props.selectedStage.id)
  }
}
</script>

<template>
  <div>
    <a-typography-title :level="5" style="margin-bottom: 12px"> 舞台设置 </a-typography-title>

    <template v-if="!selectedStage">
      <div v-if="!stage">
        <a-empty description="暂无舞台" style="padding: 24px 0" />
        <div
          style="
            margin-top: 16px;
            padding: 12px 16px;
            background: #f5f5f5;
            border-radius: 8px;
            font-size: 13px;
            color: #595959;
            line-height: 1.6;
            text-align: center;
          "
        >
          在画布顶部工具栏点击
          <strong style="color: #1890ff">添加舞台</strong>
          按钮
        </div>
      </div>
      <div v-else>
        <a-empty description="点击画布中的舞台开始编辑" style="padding: 24px 0" />
      </div>
    </template>

    <template v-else>
      <!-- 舞台信息 -->
      <a-space direction="vertical" size="middle" style="width: 100%">
        <a-form layout="vertical">
          <a-form-item label="舞台名称">
            <a-input
              :value="selectedStage.name"
              placeholder="舞台名称"
              @change="(e: any) => handleUpdate({ name: e.target.value })"
            />
          </a-form-item>
        </a-form>

        <!-- 外观设置 -->
        <div>
          <a-typography-text strong style="margin-bottom: 8px; display: block">
            外观设置
          </a-typography-text>

          <div style="margin-bottom: 12px">
            <a-typography-text
              type="secondary"
              style="font-size: 11px; display: block; margin-bottom: 4px"
            >
              舞台颜色
            </a-typography-text>
            <a-space size="small" wrap>
              <div
                v-for="color in PRESET_COLORS"
                :key="color"
                :style="{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  backgroundColor: color,
                  cursor: 'pointer',
                  border: selectedStage.color === color ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  transition: 'all 0.2s',
                }"
                @click="handleUpdate({ color })"
              />
            </a-space>
          </div>

          <div>
            <a-typography-text
              type="secondary"
              style="font-size: 11px; display: block; margin-bottom: 4px"
            >
              舞台形状
            </a-typography-text>
            <a-select
              :value="selectedStage.shape"
              style="width: 100%"
              :options="SHAPE_OPTIONS"
              @change="(val: string) => handleUpdate({ shape: val as any })"
            />
          </div>
        </div>
      </a-space>

      <!-- 尺寸设置 -->
      <div style="margin-top: 24px">
        <a-typography-title :level="5" style="margin-bottom: 12px"> 尺寸设置 </a-typography-title>

        <a-space direction="vertical" :size="12" style="width: 100%">
          <div>
            <a-space :size="12" style="width: 100%">
              <div style="flex: 1">
                <a-typography-text
                  type="secondary"
                  style="font-size: 11px; display: block; margin-bottom: 4px"
                >
                  舞台宽度
                </a-typography-text>
                <a-input-number
                  :value="Math.round(selectedStage.width)"
                  :min="100"
                  :max="800"
                  :step="10"
                  style="width: 100%"
                  placeholder="宽度"
                  addon-after="px"
                  @change="
                    (val: number) => {
                      const v = val ? Math.round(val / 10) * 10 : 480
                      handleUpdate({ width: v })
                    }
                  "
                />
              </div>
              <div style="flex: 1">
                <a-typography-text
                  type="secondary"
                  style="font-size: 11px; display: block; margin-bottom: 4px"
                >
                  舞台高度
                </a-typography-text>
                <a-input-number
                  :value="Math.round(selectedStage.height)"
                  :min="40"
                  :max="200"
                  :step="10"
                  style="width: 100%"
                  placeholder="高度"
                  addon-after="px"
                  @change="
                    (val: number) => {
                      const v = val ? Math.round(val / 10) * 10 : 40
                      handleUpdate({ height: v })
                    }
                  "
                />
              </div>
            </a-space>
            <div
              style="
                margin-top: 8px;
                padding: 8px;
                background: #fafafa;
                border-radius: 4px;
                font-size: 11px;
                color: #8c8c8c;
                word-break: break-word;
              "
            >
              尺寸会自动调整为 10 的倍数，与网格对齐。舞台固定在画布上方居中�?
            </div>
          </div>
        </a-space>
      </div>

      <a-button danger block style="margin-top: 24px" @click="handleDelete">
        <template #icon>
          <DeleteOutlined />
        </template>
        删除舞台
      </a-button>
    </template>
  </div>
</template>

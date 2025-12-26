<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const handleClose = () => {
  emit('close')
}

type Shortcut = {
  keys: string[]
  description: string
}

type ShortcutCategory = {
  category: string
  shortcuts: Shortcut[]
}

const isMac = computed(
  () =>
    typeof window !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/.test(window.navigator.userAgent),
)

const shortcutCategories: ShortcutCategory[] = [
  {
    category: '📋 基础编辑',
    shortcuts: [
      { keys: ['Ctrl', 'C'], description: '复制选中座位' },
      { keys: ['Ctrl', 'X'], description: '剪切选中座位' },
      { keys: ['Ctrl', 'V'], description: '粘贴座位' },
      { keys: ['Ctrl', 'D'], description: '快速复制（复制并偏移）' },
      { keys: ['Delete'], description: '删除选中座位（Backspace 也可）' },
      { keys: ['Ctrl', 'Z'], description: '撤销' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: '重做' },
      { keys: ['Ctrl', 'Y'], description: '重做（Windows 习惯）' },
    ],
  },
  {
    category: '🎯 选中操作',
    shortcuts: [
      { keys: ['Ctrl', 'A'], description: '全选当前楼层座位' },
      { keys: ['Esc'], description: '取消选中' },
      { keys: ['Enter'], description: '编辑选中座位（仅单选）' },
    ],
  },
  {
    category: '🔧 对齐工具',
    shortcuts: [
      { keys: ['Alt', 'A'], description: '左对齐' },
      { keys: ['Alt', 'D'], description: '右对齐' },
      { keys: ['Alt', 'H'], description: '水平居中' },
      { keys: ['Alt', 'W'], description: '顶对齐' },
      { keys: ['Alt', 'S'], description: '底对齐' },
      { keys: ['Alt', 'V'], description: '垂直居中' },
    ],
  },
  {
    category: '🔍 视图控制',
    shortcuts: [
      { keys: ['Space', '+', '拖拽'], description: '平移画布（手型工具）' },
      { keys: ['Ctrl', '+', '滚轮'], description: '缩放画布（以鼠标为中心）' },
      { keys: ['Ctrl', '='], description: '放大视图（Ctrl + + 也可）' },
      { keys: ['Ctrl', '-'], description: '缩小视图' },
      { keys: ['Ctrl', '0'], description: '重置缩放（适配画布）' },
    ],
  },
  {
    category: '🔒 高级编辑',
    shortcuts: [
      { keys: ['Ctrl', 'G'], description: '成组（将选中座位成组）' },
      { keys: ['Ctrl', 'Shift', 'G'], description: '取消成组' },
      { keys: ['Ctrl', 'L'], description: '锁定选中座位' },
      { keys: ['Ctrl', 'Shift', 'L'], description: '解锁选中座位' },
    ],
  },
  {
    category: '⚡ 快速操作',
    shortcuts: [
      { keys: ['Ctrl', 'R'], description: '批量重新编号' },
      { keys: ['Ctrl', 'E'], description: '导出当前楼层' },
      { keys: ['Ctrl', 'Shift', 'N'], description: '新建楼层' },
      { keys: ['?'], description: '显示快捷键说明（本窗口）' },
    ],
  },
]

const displayKey = (key: string): string => {
  if (isMac.value) {
    if (key === 'Ctrl') return '⌘'
    if (key === 'Shift') return '⇧'
    if (key === 'Alt') return '⌥'
  }
  return key
}
</script>

<template>
  <a-modal
    :open="props.visible"
    :footer="null"
    :width="700"
    centered
    @cancel="handleClose"
  >
    <template #title>
      <a-space>
        <QuestionCircleOutlined style="color: #1890ff" />
        <span>键盘快捷键说明</span>
      </a-space>
    </template>

    <div
      style="
        margin-bottom: 16px;
        padding: 12px;
        background: #f0f5ff;
        border-radius: 8px;
      "
    >
      <a-space>
        <AppleOutlined v-if="isMac" />
        <WindowsOutlined v-else />
        <a-typography-text type="secondary">
          当前系统: {{ isMac ? 'macOS' : 'Windows / Linux' }}
          <span
            v-if="isMac"
            style="margin-left: 8px"
          >
            （⌘ = Command，⇧ = Shift，⌥ = Option）
          </span>
        </a-typography-text>
      </a-space>
    </div>

    <div style="max-height: 60vh; overflow-y: auto; padding-right: 8px">
      <div
        v-for="(category, cIdx) in shortcutCategories"
        :key="cIdx"
        style="margin-bottom: 24px"
      >
        <a-typography-title
          :level="5"
          style="margin-bottom: 12px"
        >
          {{ category.category }}
        </a-typography-title>

        <div style="padding-left: 8px">
          <div
            v-for="(shortcut, sIdx) in category.shortcuts"
            :key="sIdx"
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 12px;
              margin-bottom: 4px;
              background: #fafafa;
              border-radius: 4px;
            "
          >
            <div style="min-width: 200px">
              <a-space size="small">
                <span
                  v-for="(key, kIdx) in shortcut.keys"
                  :key="kIdx"
                >
                  <kbd
                    style="
                      display: inline-block;
                      padding: 2px 8px;
                      font-size: 12px;
                      font-family: SF Mono, Monaco, Consolas, monospace;
                      font-weight: 600;
                      color: #24292f;
                      background: #f6f8fa;
                      border: 1px solid #d0d7de;
                      border-radius: 4px;
                      box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
                    "
                  >
                    {{ displayKey(key) }}
                  </kbd>
                  <span
                    v-if="Number(kIdx) < shortcut.keys.length - 1"
                    style="margin: 0 4px; color: #8c8c8c"
                  >
                    +
                  </span>
                </span>
              </a-space>
            </div>

            <div style="flex: 1; text-align: right">
              <a-typography-text type="secondary">
                {{ shortcut.description }}
              </a-typography-text>
            </div>
          </div>
        </div>

        <a-divider
          v-if="Number(cIdx) < shortcutCategories.length - 1"
          style="margin: 16px 0"
        />
      </div>
    </div>

    <div
      style="
        margin-top: 16px;
        padding: 12px;
        background: #fffbe6;
        border-radius: 8px;
        border: 1px solid #ffe58f;
      "
    >
      <a-space
        direction="vertical"
        size="small"
      >
        <a-typography-text
          strong
          style="color: #ad8b00"
        >
          💡 温馨提示
        </a-typography-text>
        <a-typography-text type="secondary" style="font-size: 12px">
          · 在输入框中操作时，大部分快捷键会被禁用（避免冲突）
        </a-typography-text>
        <a-typography-text type="secondary" style="font-size: 12px">
          · 成组、锁定等操作需要先选中座位才能使用
        </a-typography-text>
        <a-typography-text type="secondary" style="font-size: 12px">
          · 对齐工具至少需要选中 2 个座位
        </a-typography-text>
      </a-space>
    </div>
  </a-modal>
</template>

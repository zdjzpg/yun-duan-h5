<script setup lang="ts">
import { computed } from 'vue'
import {
  CopyOutlined,
  DeleteOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignBottomOutlined,
  LockOutlined,
  UnlockOutlined,
  EditOutlined,
  NumberOutlined,
  RedoOutlined,
  ScissorOutlined,
  GroupOutlined,
  UngroupOutlined,
  AppstoreAddOutlined,
  SelectOutlined,
  AppstoreOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons-vue'
import type { SelectedElement } from '../types.simplified'

const props = defineProps<{
  selectedElement: SelectedElement
  selectedSeats?: Array<{ id: string; groupId?: string; locked?: boolean; zoneId?: string }>
  hasClipboard: boolean
  hasSeats?: boolean
  zones?: Array<{ id: string; name: string; color: string }>
}>()

const emit = defineEmits<{
  (e: 'copy'): void
  (e: 'cut'): void
  (e: 'paste'): void
  (e: 'paste-here'): void
  (e: 'duplicate'): void
  (e: 'delete'): void
  (e: 'align', type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): void
  (e: 'lock'): void
  (e: 'unlock'): void
  (e: 'group'): void
  (e: 'ungroup'): void
  (e: 'edit'): void
  (e: 'renumber'): void
  (e: 'create-zone'): void
  (e: 'assign-zone', zoneId: string): void
  (e: 'remove-zone'): void
  (e: 'select-all'): void
}>()

const isMac =
  typeof window !== 'undefined' && /Mac|iPhone|iPad|iPod|Macintosh/.test(
    window.navigator.userAgent,
  )

const getShortcutHint = (
  key: string,
  modifier?: 'ctrl' | 'shift' | 'ctrl+shift' | 'alt',
) => {
  const ctrlLabel = isMac ? '⌘' : 'Ctrl'
  const shiftLabel = isMac ? '⇧' : 'Shift'
  const altLabel = isMac ? '⌥' : 'Alt'

  if (modifier === 'ctrl') {
    return `${ctrlLabel}+${key.toUpperCase()}`
  }
  if (modifier === 'shift') {
    return `${shiftLabel}+${key.toUpperCase()}`
  }
  if (modifier === 'ctrl+shift') {
    return `${ctrlLabel}+${shiftLabel}+${key.toUpperCase()}`
  }
  if (modifier === 'alt') {
    return `${altLabel}+${key.toUpperCase()}`
  }
  return key.toUpperCase()
}

const seatCount = computed(() => props.selectedSeats?.length || 0)
const isSingleSeat = computed(() => seatCount.value === 1)
const isMultipleSeats = computed(() => seatCount.value > 1)

const hasLocked = computed(() =>
  props.selectedSeats ? props.selectedSeats.some((s: any) => s.locked) : false,
)
const hasUnlocked = computed(() =>
  props.selectedSeats ? props.selectedSeats.some((s: any) => !s.locked) : false,
)

const hasGroup = computed(() =>
  props.selectedSeats ? props.selectedSeats.some((s: any) => s.groupId) : false,
)

const canGroup = computed(() => isMultipleSeats.value && !hasGroup.value)

const canUngroup = computed(() =>
  props.selectedSeats ? props.selectedSeats.some((s: any) => !!s.groupId) : false,
)

const hasZoneAssigned = computed(() =>
  props.selectedSeats ? props.selectedSeats.some((s: any) => s.zoneId) : false,
)

const showAlignMenu = computed(() => isMultipleSeats.value)

const handleAlignClick = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
  emit('align', type)
}
</script>

<template>
  <a-dropdown
    :trigger="['contextmenu']"
    overlayClassName="seat-context-menu"
    :overlayStyle="{ minWidth: '280px' }"
  >
    <div style="display: contents">
      <slot />
    </div>

    <template #overlay>
      <a-menu>
        <!-- 画布空白处：粘贴到这 / 全选 -->
        <template v-if="!selectedElement">
          <a-menu-item
            key="paste-here"
            :disabled="!hasClipboard"
            @click="emit('paste-here')"
          >
            <template #icon>
              <CopyOutlined />
            </template>
            <span>粘贴到这</span>
          </a-menu-item>
          <a-menu-divider />
          <a-menu-item
            key="select-all"
            :disabled="!hasSeats"
            @click="emit('select-all')"
          >
            <template #icon>
              <SelectOutlined />
            </template>
            <div class="menu-label-with-shortcut">
              <span>全选座位</span>
              <span class="shortcut-text">
                {{ getShortcutHint('A', 'ctrl') }}
              </span>
            </div>
          </a-menu-item>
        </template>

        <!-- 舞台：只允许删除 -->
        <template v-else-if="selectedElement.type === 'stage'">
          <a-menu-item
            key="delete-stage"
            danger
            @click="emit('delete')"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
            <span>删除舞台</span>
          </a-menu-item>
        </template>

        <!-- 座位选择：完整菜单 -->
        <template v-else>
          <!-- 编辑属性 / 重新编号 -->
          <a-menu-item
            key="edit"
            :disabled="!isSingleSeat"
            @click="emit('edit')"
          >
            <template #icon>
              <EditOutlined />
            </template>
            <div class="menu-label-with-shortcut">
              <span>编辑属性</span>
              <span class="shortcut-text">
                {{ getShortcutHint('Enter') }}
              </span>
            </div>
          </a-menu-item>

          <a-menu-item
            key="renumber"
            :disabled="!isMultipleSeats"
            @click="emit('renumber')"
          >
            <template #icon>
              <NumberOutlined />
            </template>
            <div class="menu-label-with-shortcut">
              <span>重新编号</span>
              <span class="shortcut-text">
                {{ getShortcutHint('R', 'ctrl') }}
              </span>
            </div>
          </a-menu-item>

          <a-menu-divider />

          <!-- 座区相关 -->
          <a-menu-item
            key="create-zone"
            @click="emit('create-zone')"
          >
            <template #icon>
              <AppstoreAddOutlined />
            </template>
            <span>创建座区</span>
          </a-menu-item>

          <a-sub-menu
            v-if="zones && zones.length"
            key="assign-zone"
          >
            <template #title>
              <span>
                <AppstoreOutlined />
                <span style="margin-left: 8px">分配座区</span>
              </span>
            </template>
            <a-menu-item
              v-for="zone in zones"
              :key="zone.id"
              @click="emit('assign-zone', zone.id)"
            >
              <a-badge
                :color="zone.color"
                :text="zone.name"
              />
            </a-menu-item>
          </a-sub-menu>

          <a-menu-item
            key="remove-zone"
            :disabled="!hasZoneAssigned"
            @click="emit('remove-zone')"
          >
            <template #icon>
              <CloseCircleOutlined />
            </template>
            <span>从座区移除</span>
          </a-menu-item>

          <a-menu-divider />

          <!-- 复制 / 剪切 / 粘贴 / 快速复制 -->
          <a-menu-item
            key="copy"
            @click="emit('copy')"
          >
            <template #icon>
              <CopyOutlined />
            </template>
            <div class="menu-label-with-shortcut">
              <span>复制</span>
              <span class="shortcut-text">
                {{ getShortcutHint('C', 'ctrl') }}
              </span>
            </div>
          </a-menu-item>

          <a-menu-item
            key="cut"
            @click="emit('cut')"
          >
            <template #icon>
              <ScissorOutlined />
            </template>
            <div class="menu-label-with-shortcut">
              <span>剪切</span>
              <span class="shortcut-text">
                {{ getShortcutHint('X', 'ctrl') }}
              </span>
            </div>
          </a-menu-item>

          <a-menu-item
            key="paste"
            :disabled="!hasClipboard"
            @click="emit('paste')"
          >
            <template #icon>
              <RedoOutlined />
            </template>
            <div class="menu-label-with-shortcut">
              <span>粘贴</span>
              <span class="shortcut-text">
                {{ getShortcutHint('V', 'ctrl') }}
              </span>
            </div>
          </a-menu-item>

          <a-menu-item
            key="duplicate"
            @click="emit('duplicate')"
          >
            <template #icon>
              <CopyOutlined />
            </template>
            <div class="menu-label-with-shortcut">
              <span>快速复制</span>
              <span class="shortcut-text">
                {{ getShortcutHint('D', 'ctrl') }}
              </span>
            </div>
          </a-menu-item>

          <a-menu-divider />

          <!-- 对齐（仅多选时显示） -->
          <a-sub-menu
            v-if="showAlignMenu"
            key="align"
          >
            <template #title>
              <span>
                <AlignLeftOutlined />
                <span style="margin-left: 8px">对齐</span>
              </span>
            </template>

            <a-menu-item
              key="align-left"
              @click="handleAlignClick('left')"
            >
              <template #icon>
                <AlignLeftOutlined />
              </template>
              <div class="menu-label-with-shortcut">
                <span>左对齐</span>
                <span class="shortcut-text">
                  {{ getShortcutHint('A', 'alt') }}
                </span>
              </div>
            </a-menu-item>
            <a-menu-item
              key="align-center"
              @click="handleAlignClick('center')"
            >
              <template #icon>
                <AlignCenterOutlined />
              </template>
              <div class="menu-label-with-shortcut">
                <span>水平居中</span>
                <span class="shortcut-text">
                  {{ getShortcutHint('H', 'alt') }}
                </span>
              </div>
            </a-menu-item>
            <a-menu-item
              key="align-right"
              @click="handleAlignClick('right')"
            >
              <template #icon>
                <AlignRightOutlined />
              </template>
              <div class="menu-label-with-shortcut">
                <span>右对齐</span>
                <span class="shortcut-text">
                  {{ getShortcutHint('D', 'alt') }}
                </span>
              </div>
            </a-menu-item>
            <a-menu-divider />
            <a-menu-item
              key="align-top"
              @click="handleAlignClick('top')"
            >
              <template #icon>
                <VerticalAlignTopOutlined />
              </template>
              <div class="menu-label-with-shortcut">
                <span>顶对齐</span>
                <span class="shortcut-text">
                  {{ getShortcutHint('W', 'alt') }}
                </span>
              </div>
            </a-menu-item>
            <a-menu-item
              key="align-middle"
              @click="handleAlignClick('middle')"
            >
              <template #icon>
                <VerticalAlignMiddleOutlined />
              </template>
              <div class="menu-label-with-shortcut">
                <span>垂直居中</span>
                <span class="shortcut-text">
                  {{ getShortcutHint('V', 'alt') }}
                </span>
              </div>
            </a-menu-item>
            <a-menu-item
              key="align-bottom"
              @click="handleAlignClick('bottom')"
            >
              <template #icon>
                <VerticalAlignBottomOutlined />
              </template>
              <div class="menu-label-with-shortcut">
                <span>底对齐</span>
                <span class="shortcut-text">
                  {{ getShortcutHint('S', 'alt') }}
                </span>
              </div>
            </a-menu-item>
          </a-sub-menu>

          <!-- 成组 / 取消成组 -->
          <a-menu-item
            key="group"
            :disabled="!canGroup"
            @click="emit('group')"
          >
            <template #icon>
              <GroupOutlined />
            </template>
            <div class="menu-label-with-shortcut">
              <span>成组</span>
              <span class="shortcut-text">
                {{ getShortcutHint('G', 'ctrl') }}
              </span>
            </div>
          </a-menu-item>

          <a-menu-item
            key="ungroup"
            :disabled="!canUngroup"
            @click="emit('ungroup')"
          >
            <template #icon>
              <UngroupOutlined />
            </template>
            <div class="menu-label-with-shortcut">
              <span>取消成组</span>
              <span class="shortcut-text">
                {{ getShortcutHint('G', 'ctrl+shift') }}
              </span>
            </div>
          </a-menu-item>

          <a-menu-divider />

          <!-- 锁定 / 解锁 -->
          <a-menu-item
            key="lock"
            :disabled="!hasUnlocked"
            @click="emit('lock')"
          >
            <template #icon>
              <LockOutlined />
            </template>
            <div class="menu-label-with-shortcut">
              <span>锁定</span>
              <span class="shortcut-text">
                {{ getShortcutHint('L', 'ctrl') }}
              </span>
            </div>
          </a-menu-item>

          <a-menu-item
            key="unlock"
            :disabled="!hasLocked"
            @click="emit('unlock')"
          >
            <template #icon>
              <UnlockOutlined />
            </template>
            <div class="menu-label-with-shortcut">
              <span>解锁</span>
              <span class="shortcut-text">
                {{ getShortcutHint('L', 'ctrl+shift') }}
              </span>
            </div>
          </a-menu-item>

          <a-menu-divider />

          <!-- 删除座位 -->
          <a-menu-item
            key="delete"
            danger
            @click="emit('delete')"
          >
            <template #icon>
              <DeleteOutlined />
            </template>
            <div class="menu-label-with-shortcut">
              <span>删除座位</span>
              <span class="shortcut-text">
                {{ getShortcutHint('Delete') }}
              </span>
            </div>
          </a-menu-item>
        </template>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<style scoped>
.menu-label-with-shortcut {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.shortcut-text {
  margin-left: 24px;
  font-size: 12px;
  color: #8c8c8c;
  font-family:
    SF Mono,
    Monaco,
    Consolas,
    monospace;
}
</style>


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
import type { SelectedElement, Seat } from './types.simplified'

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

const isSeatSelection = computed(
  () =>
    props.selectedElement &&
    (props.selectedElement.type === 'seat' || props.selectedElement.type === 'seats'),
)

const seatCount = computed(() => props.selectedSeats?.length || 0)
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

const canGroup = computed(
  () => isMultipleSeats.value && !hasGroup.value,
)

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
    :overlayStyle="{ minWidth: '220px' }"
  >
    <div style="display: contents">
      <slot />
    </div>

    <template #overlay>
      <a-menu>
        <!-- 画布空白处：基础粘贴/全选 -->
        <template v-if="!selectedElement">
          <a-menu-item
            key="paste-here"
            :disabled="!hasClipboard"
            @click="emit('paste-here')"
          >
            <CopyOutlined />
            <span style="margin-left: 8px">粘贴到这</span>
          </a-menu-item>
          <a-menu-item
            key="paste"
            :disabled="!hasClipboard"
            @click="emit('paste')"
          >
            <RedoOutlined />
            <span style="margin-left: 8px">粘贴</span>
          </a-menu-item>
          <a-menu-divider />
          <a-menu-item
            key="select-all"
            :disabled="!hasSeats"
            @click="emit('select-all')"
          >
            <SelectOutlined />
            <span style="margin-left: 8px">全选座位</span>
          </a-menu-item>
        </template>

        <!-- 舞台：只允许删除 -->
        <template v-else-if="selectedElement.type === 'stage'">
          <a-menu-item
            key="delete-stage"
            danger
            @click="emit('delete')"
          >
            <DeleteOutlined />
            <span style="margin-left: 8px">删除舞台</span>
          </a-menu-item>
        </template>

        <!-- 座位选择：完整菜单 -->
        <template v-else>
          <a-menu-item
            key="copy"
            @click="emit('copy')"
          >
            <CopyOutlined />
            <span style="margin-left: 8px">复制</span>
          </a-menu-item>

          <a-menu-item
            key="cut"
            @click="emit('cut')"
          >
            <ScissorOutlined />
            <span style="margin-left: 8px">剪切</span>
          </a-menu-item>

          <a-menu-item
            key="paste"
            :disabled="!hasClipboard"
            @click="emit('paste')"
          >
            <RedoOutlined />
            <span style="margin-left: 8px">粘贴</span>
          </a-menu-item>

          <a-menu-item
            key="paste-here"
            :disabled="!hasClipboard"
            @click="emit('paste-here')"
          >
            <CopyOutlined />
            <span style="margin-left: 8px">粘贴到这</span>
          </a-menu-item>

          <a-menu-item
            key="duplicate"
            @click="emit('duplicate')"
          >
            <CopyOutlined />
            <span style="margin-left: 8px">快速复制</span>
          </a-menu-item>

          <a-menu-divider />

          <!-- 对齐菜单，仅多选时出现 -->
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
              <AlignLeftOutlined />
              <span style="margin-left: 8px">左对齐</span>
            </a-menu-item>
            <a-menu-item
              key="align-center"
              @click="handleAlignClick('center')"
            >
              <AlignCenterOutlined />
              <span style="margin-left: 8px">水平居中</span>
            </a-menu-item>
            <a-menu-item
              key="align-right"
              @click="handleAlignClick('right')"
            >
              <AlignRightOutlined />
              <span style="margin-left: 8px">右对齐</span>
            </a-menu-item>
            <a-menu-divider />
            <a-menu-item
              key="align-top"
              @click="handleAlignClick('top')"
            >
              <VerticalAlignTopOutlined />
              <span style="margin-left: 8px">顶对齐</span>
            </a-menu-item>
            <a-menu-item
              key="align-middle"
              @click="handleAlignClick('middle')"
            >
              <VerticalAlignMiddleOutlined />
              <span style="margin-left: 8px">垂直居中</span>
            </a-menu-item>
            <a-menu-item
              key="align-bottom"
              @click="handleAlignClick('bottom')"
            >
              <VerticalAlignBottomOutlined />
              <span style="margin-left: 8px">底对齐</span>
            </a-menu-item>
          </a-sub-menu>

          <!-- 成组 / 取消成组 -->
          <a-menu-item
            key="group"
            :disabled="!canGroup"
            @click="emit('group')"
          >
            <GroupOutlined />
            <span style="margin-left: 8px">成组</span>
          </a-menu-item>

          <a-menu-item
            key="ungroup"
            :disabled="!canUngroup"
            @click="emit('ungroup')"
          >
            <UngroupOutlined />
            <span style="margin-left: 8px">取消成组</span>
          </a-menu-item>

          <a-menu-divider />

          <!-- 锁定 / 解锁 -->
          <a-menu-item
            key="lock"
            :disabled="!hasUnlocked"
            @click="emit('lock')"
          >
            <LockOutlined />
            <span style="margin-left: 8px">锁定</span>
          </a-menu-item>

          <a-menu-item
            key="unlock"
            :disabled="!hasLocked"
            @click="emit('unlock')"
          >
            <UnlockOutlined />
            <span style="margin-left: 8px">解锁</span>
          </a-menu-item>

          <a-menu-divider />

          <!-- 座区相关 -->
          <a-menu-item
            key="create-zone"
            @click="emit('create-zone')"
          >
            <AppstoreAddOutlined />
            <span style="margin-left: 8px">基于选中创建座区</span>
          </a-menu-item>

          <a-sub-menu
            v-if="zones && zones.length"
            key="assign-zone"
          >
            <template #title>
              <span>
                <AppstoreOutlined />
                <span style="margin-left: 8px">分配到座区</span>
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
            <CloseCircleOutlined />
            <span style="margin-left: 8px">从座区移除</span>
          </a-menu-item>

          <a-menu-divider />

          <a-menu-item
            key="edit"
            @click="emit('edit')"
          >
            <EditOutlined />
            <span style="margin-left: 8px">编辑属性</span>
          </a-menu-item>

          <a-menu-item
            key="renumber"
            @click="emit('renumber')"
          >
            <NumberOutlined />
            <span style="margin-left: 8px">重新编号</span>
          </a-menu-item>

          <a-menu-divider />

          <a-menu-item
            key="delete"
            danger
            @click="emit('delete')"
          >
            <DeleteOutlined />
            <span style="margin-left: 8px">删除座位</span>
          </a-menu-item>
        </template>
      </a-menu>
    </template>
  </a-dropdown>
</template>

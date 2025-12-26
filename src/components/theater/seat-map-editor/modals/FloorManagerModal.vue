<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  HolderOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue'
import Modal from 'ant-design-vue/es/modal'
import message from 'ant-design-vue/es/message'
import type { Floor } from '../types.simplified'
import draggable from 'vuedraggable'

const props = defineProps<{
  visible: boolean
  floors: Floor[]
}>()

const emit = defineEmits<{
  (e: 'ok', floors: Floor[]): void
  (e: 'cancel'): void
}>()

const editingFloors = ref<Floor[]>([])
const editingFloorId = ref<string | null>(null)
const editValue = ref('')

const syncFromProps = () => {
  editingFloors.value = (props.floors || []).map((f: Floor) => ({ ...f }))
}

watch(
  () => props.floors,
  () => {
    if (!props.visible) return
    syncFromProps()
  },
  { deep: true },
)

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      syncFromProps()
    }
  },
  { immediate: true },
)

const generateId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

const handleAdd = () => {
  const maxLevel =
    editingFloors.value.length > 0
      ? Math.max(...editingFloors.value.map((f: Floor) => f.level || 0))
      : 0

  const newFloor: Floor = {
    id: generateId('floor'),
    name: `${maxLevel + 1}F`,
    level: maxLevel + 1,
  }

  editingFloors.value = [...editingFloors.value, newFloor]
  message.success(`已添加楼层 ${newFloor.name}`)
}

const handleDelete = (floorId: string) => {
  const floor = editingFloors.value.find((f: Floor) => f.id === floorId)
  if (!floor) return

  if (editingFloors.value.length <= 1) {
    message.warning('至少需要保留 1 个楼层')
    return
  }

  Modal.confirm({
    title: '确认删除楼层',
    content: `删除楼层「${floor.name}」可能会影响该楼层关联的座位、座区等数据，建议先清空该楼层内的数据。`,
    okText: '确认删除',
    okType: 'danger' as any,
    cancelText: '取消',
    centered: true,
    onOk: () => {
      editingFloors.value = editingFloors.value.filter((f: Floor) => f.id !== floorId)
      message.success(`已删除楼层 ${floor.name}`)
    },
  } as any)
}

const handleStartEdit = (floorId: string, currentName: string) => {
  editingFloorId.value = floorId
  editValue.value = currentName
}

const handleSaveEdit = (floorId: string, newName: string) => {
  const nextName = newName.trim()
  if (!nextName) {
    message.warning('楼层名称不能为空')
    return
  }

  const duplicated = editingFloors.value.some(
    (f: Floor) => f.id !== floorId && f.name === nextName,
  )
  if (duplicated) {
    message.warning('楼层名称不能重复')
    return
  }

  editingFloors.value = editingFloors.value.map((f: Floor) =>
    f.id === floorId ? { ...f, name: nextName } : f,
  )
  editingFloorId.value = null
  editValue.value = ''
  message.success('楼层名称已更新')
}

const handleCancelEdit = () => {
  editingFloorId.value = null
  editValue.value = ''
}

const handleMove = () => {
  // vuedraggable 已根据拖拽结果更新了 editingFloors 顺序，这里只同步 level
  editingFloors.value = editingFloors.value.map((f: Floor, idx: number) => ({
    ...f,
    level: idx + 1,
  }))
}

const handleOk = () => {
  emit('ok', editingFloors.value.map((f: Floor) => ({ ...f })))
}

const handleCancel = () => {
  syncFromProps()
  editingFloorId.value = null
  editValue.value = ''
  emit('cancel')
}
</script>

<template>
  <a-modal
    title="楼层管理"
    :open="props.visible"
    width="600"
    centered
    ok-text="保存"
    cancel-text="取消"
    destroy-on-close
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div style="margin-bottom: 16px">
      <a-button
        type="primary"
        block
        @click="handleAdd"
      >
        <template #icon>
          <PlusOutlined />
        </template>
        添加楼层
      </a-button>
    </div>

    <div
      style="
        margin-bottom: 8px;
        padding: 8px 12px;
        background: #f5f5f5;
        border-radius: 4px;
        font-size: 12px;
        color: #595959;
      "
    >
      💡 提示：拖动楼层条目可以调整顺序，双击名称或点击编辑图标可以重命名楼层。
    </div>

    <div style="max-height: 400px; overflow-y: auto">
      <template v-if="editingFloors.length">
        <draggable
          v-model="editingFloors"
          item-key="id"
          handle=".floor-item-handle"
          @update="handleMove"
        >
          <template #item="{ element }">
            <div
              :key="element.id"
              style="
                padding: 12px 16px;
                background: #fff;
                border: 1px solid #d9d9d9;
                border-radius: 4px;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: move;
              "
            >
              <span class="floor-item-handle">
                <HolderOutlined style="font-size: 16px; color: #8c8c8c" />
              </span>

              <template v-if="editingFloorId === element.id">
                <a-input
                  v-model:value="editValue"
                  style="flex: 1"
                  @press-enter="handleSaveEdit(element.id, editValue)"
                >
                  <template #suffix>
                    <a-space :size="4">
                      <a-button
                        type="text"
                        size="small"
                        style="color: #52c41a"
                        @click.stop="handleSaveEdit(element.id, editValue)"
                      >
                        <template #icon>
                          <CheckOutlined />
                        </template>
                      </a-button>
                      <a-button
                        type="text"
                        size="small"
                        style="color: #ff4d4f"
                        @click.stop="handleCancelEdit"
                      >
                        <template #icon>
                          <CloseOutlined />
                        </template>
                      </a-button>
                    </a-space>
                  </template>
                </a-input>
              </template>
              <template v-else>
                <a-typography-text
                  style="flex: 1; font-size: 14px"
                  @dblclick="handleStartEdit(element.id, element.name)"
                >
                  {{ element.name }}
                </a-typography-text>

                <a-space :size="4">
                  <a-tooltip title="重命名楼层">
                    <a-button
                      type="text"
                      size="small"
                      @click.stop="handleStartEdit(element.id, element.name)"
                    >
                      <EditOutlined />
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="删除楼层">
                    <a-button
                      type="text"
                      size="small"
                      danger
                      @click.stop="handleDelete(element.id)"
                    >
                      <DeleteOutlined />
                    </a-button>
                  </a-tooltip>
                </a-space>
              </template>
            </div>
          </template>
        </draggable>
      </template>
      <div
        v-else
        style="padding: 40px; text-align: center; color: #8c8c8c"
      >
        暂无楼层，请点击上方按钮添加
      </div>
    </div>
  </a-modal>
</template>

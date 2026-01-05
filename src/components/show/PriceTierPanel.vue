<script setup lang="ts">
import { computed, ref } from 'vue'
import Modal from 'ant-design-vue/es/modal'
import message from 'ant-design-vue/es/message'
import type { ShowPriceTier } from '@/types/theater'
import type { PriceTierStats } from '@/api/endpoints/show/types'

const props = defineProps<{
  showId: string
  priceTiers: ShowPriceTier[]
  stats?: PriceTierStats[]
  selectedTierId?: string
}>()

const emit = defineEmits<{
  (e: 'selectTier', id: string | undefined): void
  (e: 'createTier', payload: { name: string; price: number; color: string; remark?: string }): void
  (e: 'updateTier', id: string, payload: { name?: string; price?: number; color?: string; remark?: string }): void
  (e: 'deleteTier', id: string): void
}>()

const editingTier = ref<ShowPriceTier | null>(null)
const tierModalVisible = ref(false)
const tierForm = ref({
  name: '',
  price: undefined as number | undefined,
  color: '#1890ff',
  remark: '',
})

const statsMap = computed<Record<string, PriceTierStats>>(() => {
  const map: Record<string, PriceTierStats> = {}
  if (props.stats) {
    props.stats.forEach((s: PriceTierStats) => {
      map[s.priceTierId] = s
    })
  }
  return map
})

const selectedRowKeys = computed<(string | number)[]>(() =>
  props.selectedTierId ? [props.selectedTierId] : [],
)

const handleRowSelectionChange = (keys: (string | number)[]) => {
  const id = (keys[0] as string) || undefined
  emit('selectTier', id)
}

const openCreateModal = () => {
  editingTier.value = null
  tierForm.value = {
    name: '',
    price: undefined,
    color: '#1890ff',
    remark: '',
  }
  tierModalVisible.value = true
}

const openEditModal = (tier: ShowPriceTier) => {
  editingTier.value = tier
  tierForm.value = {
    name: tier.name,
    price: tier.price / 100,
    color: tier.color || '#1890ff',
    remark: tier.remark || '',
  }
  tierModalVisible.value = true
}

const handleConfirmTier = () => {
  const name = tierForm.value.name.trim()
  if (!name) {
    message.error('请输入票档名称')
    return
  }

  const price = tierForm.value.price
  if (price == null || price <= 0) {
    message.error('请输入有效的票价')
    return
  }

  const payload = {
    name,
    price: Math.round(price * 100),
    color: tierForm.value.color || '#1890ff',
    remark: tierForm.value.remark?.trim() || undefined,
  }

  if (editingTier.value) {
    emit('updateTier', editingTier.value.id, payload)
    message.success('票档更新成功')
  } else {
    emit('createTier', payload)
    message.success('票档创建成功')
  }

  tierModalVisible.value = false
}

const confirmDeleteTier = (tier: ShowPriceTier) => {
  const stat = props.stats?.find((s: PriceTierStats) => s.priceTierId === tier.id)
  const assignedCount = stat?.assignedCount ?? 0

  const content =
    assignedCount > 0
      ? `该票档已分配 ${assignedCount} 个座位，删除后这些座位将变为未分配状态。是否确认删除？`
      : '确认删除该票档？'

  Modal.confirm({
    title: '删除票档',
    content,
    okText: '删除',
    okType: 'danger' as any,
    cancelText: '取消',
    centered: true,
    onOk: () => emit('deleteTier', tier.id),
  } as any)
}
</script>

<template>
  <div style="height: 100%">
    <a-card
      title="票档配置"
      :bordered="false"
      style="height: 100%; box-shadow: none; border: 1px solid #f0f0f0"
    >
      <template #extra>
        <a-button type="primary" size="small" @click="openCreateModal">新建票档</a-button>
      </template>

      <a-table
        :data-source="priceTiers"
        :pagination="false"
        size="small"
        row-key="id"
        :row-selection="{
          type: 'radio',
          selectedRowKeys,
          onChange: handleRowSelectionChange,
        }"
        :scroll="{ y: 400 }"
      >
        <a-table-column key="name" data-index="name" title="票档名称" :width="140">
          <template #default="{ record }">
            <a-space :size="8">
              <div
                :style="{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  backgroundColor: record.color || '#f0f0f0',
                }"
              />
              <span>{{ record.name }}</span>
            </a-space>
          </template>
        </a-table-column>

        <a-table-column key="price" title="票价" :width="100" align="right">
          <template #default="{ record }">
            ¥{{ (record.price / 100).toFixed(2) }}
          </template>
        </a-table-column>

        <a-table-column key="assigned" title="已分配座位" :width="110" align="right">
          <template #default="{ record }">
            {{ statsMap[record.id]?.assignedCount ?? 0 }}
          </template>
        </a-table-column>

        <a-table-column key="revenue" title="预估收入" :width="120" align="right">
          <template #default="{ record }">
            ¥{{ ((statsMap[record.id]?.totalRevenue ?? 0) / 100).toFixed(2) }}
          </template>
        </a-table-column>

        <a-table-column key="actions" title="操作" :width="120" align="center">
          <template #default="{ record }">
            <a-space :size="8">
              <a-button
                type="link"
                size="small"
                style="padding: 0"
                @click="openEditModal(record)"
              >
                编辑
              </a-button>
              <a-button
                type="link"
                size="small"
                danger
                style="padding: 0"
                @click="confirmDeleteTier(record)"
              >
                删除
              </a-button>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </a-card>

    <a-modal
      :open="tierModalVisible"
      :title="editingTier ? '编辑票档' : '新建票档'"
      width="480"
      @ok="handleConfirmTier"
      @cancel="tierModalVisible = false"
    >
      <a-form layout="vertical">
        <a-form-item label="票档名称">
          <a-input
            v-model:value="tierForm.name"
            placeholder="请输入票档名称"
            :maxlength="20"
          />
        </a-form-item>

        <a-form-item label="票面价（元）">
          <a-input-number
            v-model:value="tierForm.price"
            :min="0"
            :max="999999"
            :precision="2"
            style="width: 100%"
            placeholder="请输入票价"
          />
        </a-form-item>

        <a-form-item label="票档颜色">
          <a-space>
            <div
              :style="{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                border: '1px solid #d9d9d9',
                backgroundColor: tierForm.color,
              }"
            />
            <a-input v-model:value="tierForm.color" style="width: 120px" />
            <a-typography-text type="secondary" style="font-size: 12px">
              建议使用十六进制颜色值
            </a-typography-text>
          </a-space>
        </a-form-item>

        <a-form-item label="备注">
          <a-textarea
            v-model:value="tierForm.remark"
            :rows="3"
            :maxlength="50"
            placeholder="选填：票档说明、包含的权益等"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>


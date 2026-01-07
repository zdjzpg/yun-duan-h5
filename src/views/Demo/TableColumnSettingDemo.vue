<script setup lang="ts">
import { ref } from 'vue'
import TableColumnSetting from '@/components/table/TableColumnSetting.vue'
import { useTableColumnSetting, type ColumnSettingColumn } from '@/hooks/useTableColumnSetting'

type DemoRow = {
  id: number
  name: string
  phone: string
  status: 'active' | 'inactive'
  level: string
  balance: number
  points: number
}

const mockData: DemoRow[] = [
  { id: 1, name: 'Cynthia', phone: '13800000000', status: 'active', level: '铂金', balance: 520.5, points: 880 },
  { id: 2, name: 'Leo', phone: '13900000000', status: 'inactive', level: '金卡', balance: 200, points: 120 },
  { id: 3, name: 'Maggie', phone: '13600000000', status: 'active', level: '黑金', balance: 9999, points: 5560 },
  { id: 4, name: 'Joey', phone: '13500000000', status: 'active', level: '银卡', balance: 60, points: 90 },
  { id: 5, name: 'Elena', phone: '13700000000', status: 'inactive', level: '普卡', balance: 10, points: 15 },
]

const dataSource = ref(mockData)

const demoColumns: ColumnSettingColumn<DemoRow>[] = [
  {
    title: '序号',
    key: '__index__',
    width: 80,
    align: 'center' as const,
    enableSetting: false,
  },
  {
    title: '会员姓名',
    dataIndex: 'name',
    key: 'name',
    width: 140,
  },
  {
    title: '手机号',
    dataIndex: 'phone',
    key: 'phone',
    width: 160,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
  },
  {
    title: '会员等级',
    dataIndex: 'level',
    key: 'level',
    width: 120,
  },
  {
    title: '余额',
    dataIndex: 'balance',
    key: 'balance',
    width: 120,
    align: 'right' as const,
  },
  {
    title: '积分',
    dataIndex: 'points',
    key: 'points',
    width: 120,
    align: 'right' as const,
  },
]

const {
  visibleColumns,
  columnSettingItems,
  checkedKeys: checkedColumnKeys,
  updateCheckedKeys,
} = useTableColumnSetting<DemoRow>({
  columns: demoColumns,
  storageKey: 'demo-table-column-setting',
})
</script>

<template>
  <div class="table-column-demo">
    <a-card title="表格列自定义 Demo">
      <p class="table-column-demo__desc">
        该页面展示了 <code>useTableColumnSetting</code> Hook 与 <code>TableColumnSetting</code> 组件的组合用法，可以直接在头部弹窗里控制列显隐。
      </p>
      <a-table
        :columns="visibleColumns"
        :data-source="dataSource"
        size="middle"
        row-key="id"
        :pagination="false"
      >
        <template #headerCell="{ column }">
          <template v-if="column.key === '__index__'">
            <div class="table-column-demo__column-setting">
              <TableColumnSetting
                :columns="columnSettingItems"
                :checked-keys="checkedColumnKeys"
                @confirm="updateCheckedKeys"
              />
            </div>
          </template>
        </template>

        <template #bodyCell="{ column, text, index }">
          <template v-if="column.key === '__index__'">
            {{ index + 1 }}
          </template>
          <template v-else-if="column.key === 'status'">
            <a-badge :status="text === 'active' ? 'success' : 'default'" :text="text === 'active' ? '启用' : '停用'" />
          </template>
          <template v-else-if="column.key === 'balance' || column.key === 'points'">
            {{ Number(text).toLocaleString() }}
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped>
.table-column-demo {
  padding: 24px;
}

.table-column-demo__desc {
  margin-bottom: 16px;
  color: #4e5969;
}

.table-column-demo__column-setting {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>

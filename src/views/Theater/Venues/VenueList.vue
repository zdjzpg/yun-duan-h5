<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import message from 'ant-design-vue/es/message'
import { useRouter } from 'vue-router'
import {
  fetchVenues,
  updateVenueStatus,
  deleteVenue,
  type Venue,
  type VenueListRequest,
  type VenueStatus,
  type VenueCapacityType,
} from '@/api/theaterVenue'
import ListPageLayout from '@/components/layouts/ListPageLayout.vue'

const router = useRouter()

const keyword = ref('')
const status = ref<VenueStatus | undefined>(undefined)

const loading = ref(false)
const dataSource = ref<Venue[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const columns = [
  {
    title: '场馆名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
  {
    title: '座位类型',
    dataIndex: 'capacityType',
    key: 'capacityType',
    width: 150,
  },
  {
    title: '总可用容量',
    dataIndex: 'totalCapacity',
    key: 'totalCapacity',
    width: 120,
    align: 'right' as const,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: '最近更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 180,
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    fixed: 'right' as const,
    align: 'right' as const,
  },
]

const fetchList = async () => {
  try {
    loading.value = true
    const params: VenueListRequest = {
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      status: status.value,
    }

    const res = await fetchVenues(params)
    dataSource.value = res.list
    total.value = res.total
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

watch([keyword, status], () => {
  page.value = 1
  fetchList()
})

onMounted(() => {
  fetchList()
})

const handleUpdateStatus = async (id: string, newStatus: VenueStatus) => {
  const text = newStatus === 'active' ? '启用' : '停用'
  try {
    await updateVenueStatus(id, newStatus)
    message.success(`${text}成功`)
    fetchList()
  } catch (err) {
    console.error(err)
  }
}

const handleDelete = async (id: string) => {
  try {
    await deleteVenue(id)
    message.success('删除成功')
    fetchList()
  } catch (err) {
    console.error(err)
  }
}

const handleExport = () => {
  if (!dataSource.value.length) {
    message.warning('暂无数据可导出')
    return
  }

  const capacityTypeMap: Record<VenueCapacityType, string> = {
    free_seating: '自由站席',
    zone_capacity: '按座区数量',
    precise_seat: '精确座位',
  }

  const statusMap: Record<VenueStatus, string> = {
    active: '启用',
    inactive: '停用',
  }

  const rows = dataSource.value.map((venue: Venue) => ({
    name: venue.name,
    capacityType: capacityTypeMap[venue.capacityType],
    totalCapacity: venue.totalCapacity,
    status: statusMap[venue.status],
    address: venue.address || '',
    createdAt: venue.createdAt
      ? new Date(venue.createdAt).toLocaleString('zh-CN')
      : '',
    updatedAt: venue.updatedAt
      ? new Date(venue.updatedAt).toLocaleString('zh-CN')
      : '',
  }))

  const headers = [
    '场馆名称',
    '座位类型',
    '总容量',
    '状态',
    '地址',
    '创建时间',
    '更新时间',
  ]

  type ExportRow = (typeof rows)[number]

  const csv = [
    headers.join(','),
    ...rows.map((row: ExportRow) =>
      [
        row.name,
        row.capacityType,
        row.totalCapacity,
        row.status,
        row.address,
        row.createdAt,
        row.updatedAt,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(','),
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `场馆列表_${new Date()
    .toLocaleDateString('zh-CN')
    .replace(/\//g, '-')}.csv`
  link.click()

  URL.revokeObjectURL(url)
}
</script>

<template>
  <ListPageLayout
    :actions="[
      {
        label: '新建场馆',
        type: 'primary',
        onClick: () => router.push('/dashboard/theater/venues/new'),
      },
      {
        label: '导出',
        type: 'default',
        onClick: handleExport,
      },
    ]"
  >
    <template #filters>
      <a-input
        v-model:value="keyword"
        placeholder="搜索场馆名称"
        style="width: 216px"
        allow-clear
      />
      <a-select
        v-model:value="status"
        placeholder="全部状态"
        allow-clear
        style="width: 216px"
      >
        <a-select-option value="active">启用</a-select-option>
        <a-select-option value="inactive">停用</a-select-option>
      </a-select>
    </template>

    <a-table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      row-key="id"
      :pagination="{
        current: page,
        pageSize: pageSize,
        total: total,
        showSizeChanger: false,
        showTotal: (t: number) => `共 ${t} 条`,
        onChange: (p: number) => {
          page.value = p
          fetchList()
        },
      }"
    >
      <template #bodyCell="{ column, text, record }">
        <template v-if="column.key === 'capacityType'">
          <span v-if="text === 'free_seating'">自由站席</span>
          <span v-else-if="text === 'zone_capacity'">按座区数量</span>
          <span v-else>精确座位</span>
        </template>

        <template v-else-if="column.key === 'totalCapacity'">
          {{ Number(text).toLocaleString() }} 人
        </template>

        <template v-else-if="column.key === 'status'">
          <a-badge v-if="text === 'active'" status="success" text="启用" />
          <a-badge v-else status="default" text="停用" />
        </template>

        <template v-else-if="column.key === 'updatedAt'">
          {{
            new Date(text).toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          }}
        </template>

        <template v-else-if="column.key === 'actions'">
          <a-space size="small">
            <a @click="router.push(`/dashboard/theater/venues/${record.id}`)">编辑</a>
            <a
              @click="
                handleUpdateStatus(
                  record.id,
                  record.status === 'active' ? 'inactive' : 'active',
                )
              "
            >
              {{ record.status === 'active' ? '停用' : '启用' }}
            </a>
            <a-popconfirm
              title="确认删除该场馆吗？"
              ok-text="确认"
              cancel-text="取消"
              @confirm="() => handleDelete(record.id)"
            >
              <a>删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
  </ListPageLayout>
</template>

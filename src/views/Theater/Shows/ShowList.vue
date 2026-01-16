<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import message from 'ant-design-vue/es/message'
import ListPageLayout from '@/components/layouts/ListPageLayout.vue'
import {
  fetchShows,
  updateShowStatus,
  deleteShow,
  showStatusToDtoCode,
  type ShowListRequestDto,
  type ShowStatus,
} from '@/api/show'
import { fetchVenues, type VenueListRequest, type Venue } from '@/api/theaterVenue'
import type { Show, ShowType } from '@/types/theater'

const router = useRouter()

const keyword = ref('')
const venueId = ref<string | undefined>(undefined)
const status = ref<ShowStatus | undefined>(undefined)

const loading = ref(false)
const dataSource = ref<Show[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const venueOptionsLoading = ref(false)
const venueOptions = ref<Array<{ label: string; value: string }>>([])

const SHOW_TYPE_MAP: Record<ShowType, string> = {
  live_show: '实景演出',
  musical: '音乐剧',
  drama: '话剧',
  concert: '演唱会',
  other: '其他',
}

const SHOW_STATUS_CONFIG: Record<
  ShowStatus,
  { text: string; status: 'default' | 'success' | 'error' | 'warning' }
> = {
  on_sale: { text: '在售', status: 'success' },
  draft: { text: '草稿', status: 'default' },
  off_sale: { text: '停售', status: 'warning' },
  finished: { text: '已结束', status: 'error' },
}

const columns = [
  {
    title: '演出名称',
    dataIndex: 'name',
    key: 'name',
    width: 220,
    fixed: 'left' as const,
  },
  {
    title: '演出类型',
    dataIndex: 'type',
    key: 'type',
    width: 120,
  },
  {
    title: '场次数量',
    dataIndex: 'sessionCount',
    key: 'sessionCount',
    width: 110,
    align: 'right' as const,
  },
  {
    title: '最近开演',
    dataIndex: 'nextSessionTime',
    key: 'nextSessionTime',
    width: 180,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
  },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    fixed: 'right' as const,
    align: 'right' as const,
  },
]

const fetchList = async () => {
  try {
    loading.value = true
    const currentStatus = status.value as ShowStatus | undefined
    const params: ShowListRequestDto = {
      Page: page.value,
      PageSize: pageSize.value,
      Keyword: keyword.value || '',
      VenueUid: extractNumericUid(venueId.value),
      ShowStatus: currentStatus ? showStatusToDtoCode[currentStatus] ?? 0 : 0,
    }
    const res = await fetchShows(params)
    dataSource.value = res.list
    total.value = res.total
  } catch (err) {
    console.error(err)
    message.error('获取演出列表失败')
  } finally {
    loading.value = false
  }
}

watch([keyword, venueId, status], () => {
  page.value = 1
  fetchList()
})

const loadVenues = async () => {
  try {
    venueOptionsLoading.value = true
    const params: VenueListRequest = {
      page: 1,
      pageSize: 100,
      status: 'active',
    }
    const res = await fetchVenues(params)
    venueOptions.value = res.list.map((venue: Venue) => ({
      label: venue.name,
      value: venue.id,
    }))
  } catch (err) {
    console.error(err)
    message.error('获取场馆列表失败')
  } finally {
    venueOptionsLoading.value = false
  }
}

onMounted(() => {
  loadVenues()
  fetchList()
})

const handleUpdateStatus = async (id: string, newStatus: ShowStatus) => {
  const text = SHOW_STATUS_CONFIG[newStatus].text
  const uid = extractNumericUid(id)
  if (!uid) {
    message.error('未找到演出 UID')
    return
  }
  try {
    await updateShowStatus(uid, newStatus)
    message.success(`状态已更新为「${text}」`)
    fetchList()
  } catch (err) {
    console.error(err)
    message.error('更新状态失败')
  }
}

const handleDelete = async (id: string) => {
  const uid = extractNumericUid(id)
  if (!uid) {
    message.error('未找到演出 UID')
    return
  }
  try {
    await deleteShow(uid)
    message.success('删除演出成功')
    fetchList()
  } catch (err) {
    console.error(err)
    message.error('删除演出失败')
  }
}

const handleExport = () => {
  if (!dataSource.value.length) {
    message.warning('暂无数据可导出')
    return
  }

  const rows = dataSource.value.map((show: Show) => ({
    name: show.name,
    type: SHOW_TYPE_MAP[show.type],
    status: SHOW_STATUS_CONFIG[show.status].text,
    sessionCount: show.sessionCount || 0,
    nextSessionTime: show.nextSessionTime
      ? new Date(show.nextSessionTime).toLocaleString('zh-CN')
      : '',
    createdAt: new Date(show.createdAt).toLocaleString('zh-CN'),
  }))

  const headers = ['演出名称', '演出类型', '状态', '场次数量', '最近开演', '创建时间']

  type ExportRow = (typeof rows)[number]

  const csv = [
    headers.join(','),
    ...rows.map((row: ExportRow) =>
      [row.name, row.type, row.status, row.sessionCount, row.nextSessionTime, row.createdAt]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(','),
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `演出列表_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`
  link.click()

  URL.revokeObjectURL(url)
}

function extractNumericUid(value?: string | number | null): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value
  }
  if (typeof value === 'string') {
    const digits = value.match(/\d+/g)?.join('')
    if (digits) {
      const parsed = Number(digits)
      if (!Number.isNaN(parsed)) {
        return parsed
      }
    }
  }
  return null
}
</script>

<template>
  <ListPageLayout
    :actions="[
      {
        label: '新建演出',
        type: 'primary',
        onClick: () => router.push('/dashboard/theater/shows/new'),
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
        placeholder="搜索演出名称"
        style="width: 216px"
        allow-clear
      />
      <a-select
        v-model:value="venueId"
        placeholder="全部场馆"
        style="width: 216px"
        allow-clear
        show-search
        option-filter-prop="label"
        :loading="venueOptionsLoading"
        :options="venueOptions"
      />
      <a-select v-model:value="status" placeholder="全部状态" allow-clear style="width: 216px">
        <a-select-option value="on_sale">在售</a-select-option>
        <a-select-option value="draft">草稿</a-select-option>
        <a-select-option value="off_sale">停售</a-select-option>
        <a-select-option value="finished">已结束</a-select-option>
      </a-select>
    </template>

    <a-table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      row-key="id"
      :scroll="{ x: 1200 }"
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
        <template v-if="column.key === 'name'">
          <span>{{ record.name }}</span>
        </template>

        <template v-else-if="column.key === 'type'">
          {{ SHOW_TYPE_MAP[text as ShowType] }}
        </template>

        <template v-else-if="column.key === 'sessionCount'">
          {{ (text || 0) + ' 场' }}
        </template>

        <template v-else-if="column.key === 'nextSessionTime'">
          {{
            text
              ? new Date(text as string).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-'
          }}
        </template>

        <template v-else-if="column.key === 'status'">
          <a-badge
            :status="SHOW_STATUS_CONFIG[text as ShowStatus].status"
            :text="SHOW_STATUS_CONFIG[text as ShowStatus].text"
          />
        </template>

        <template v-else-if="column.key === 'createdAt'">
          {{
            text
              ? new Date(text as string).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-'
          }}
        </template>

        <template v-else-if="column.key === 'actions'">
          <a-space size="small">
            <a @click="router.push(`/dashboard/theater/shows/${record.id}`)">编辑</a>
            <a v-if="record.status === 'draft'" @click="handleUpdateStatus(record.id, 'on_sale')">
              上架
            </a>
            <a
              v-else-if="record.status === 'on_sale'"
              @click="handleUpdateStatus(record.id, 'off_sale')"
            >
              停售
            </a>
            <a
              v-else-if="record.status === 'off_sale'"
              @click="handleUpdateStatus(record.id, 'on_sale')"
            >
              上架
            </a>

            <a-popconfirm
              title="确认删除该演出吗？"
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

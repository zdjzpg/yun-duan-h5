<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { SearchOutlined } from '@ant-design/icons-vue'
type RawStore = {
  id: number
  account: string
  company: string
  address: string
  userType: number | null
  isFranchise: number | null
  number: string | null
  subUsers: RawStore[] | null
}

type StoreTreeNode = {
  key: string
  title: string
  raw: RawStore
  children?: StoreTreeNode[]
  totalDescCount?: number
}

const props = defineProps<{
  open: boolean
  selectedIds: number[]
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:selectedIds', value: number[]): void
}>()

const visible = ref<boolean>(props.open)

// 同步外部 open -> 内部 visible
watch(
  () => props.open,
  (val: boolean) => {
    if (val !== visible.value) {
      visible.value = val
    }
  },
)

// 同步内部 visible -> 外部 v-model:open
watch(visible, (val: boolean) => {
  if (val !== props.open) {
    emit('update:open', val)
  }
})

// ---- mock data ----

const MOCK_STORES: RawStore[] = [
  {
    subUsers: null,
    id: 3122001,
    account: 'cyjtest1',
    address: '福建省厦门市思明区中航紫金广场A塔',
    company: 'cyjtest1',
    userType: 0,
    isFranchise: 1,
    number: '1001',
  },
  {
    subUsers: null,
    id: 3122002,
    account: 'cyjtest2',
    address: '福建省厦门市海沧',
    company: 'cyjtest2--仓库',
    userType: 2,
    isFranchise: 1,
    number: '1002',
  },
  {
    subUsers: null,
    id: 3122003,
    account: 'cyjtest3',
    address: '海外省阿根廷市111',
    company: 'cyjtest3--生产车间',
    userType: 0,
    isFranchise: 1,
    number: '1003',
  },
  {
    subUsers: null,
    id: 3122004,
    account: 'cyjtest4',
    address: '福建省福州市111',
    company: 'cyjtest4-配料间',
    userType: 2,
    isFranchise: 1,
    number: '1004',
  },
  {
    subUsers: [
      {
        subUsers: null,
        id: 72615,
        account: 'adasun4',
        address: '海外省阿根廷市思明区毕利达大厦',
        company: 'adasun4--72615',
        userType: null,
        isFranchise: 1,
        number: null,
      },
      {
        subUsers: null,
        id: 3122007,
        account: 'cyjtest7',
        address: '福建省福州市111',
        company: 'cyjtest7--琴行/艺培',
        userType: 0,
        isFranchise: 1,
        number: 'qy07',
      },
      {
        subUsers: null,
        id: 3122008,
        account: 'cyjtest8',
        address: '福建省福州市111',
        company: 'cyjtest8--服装',
        userType: 0,
        isFranchise: 1,
        number: 'qy08',
      },
      {
        subUsers: null,
        id: 3122009,
        account: 'cyjtest9',
        address: '福建省福州市111',
        company: 'cyjtest9二级管理',
        userType: 0,
        isFranchise: 1,
        number: 'qy09',
      },
      {
        subUsers: [
          {
            subUsers: null,
            id: 3122011,
            account: 'cyjtest11',
            address: '福建省厦门市111',
            company: 'cyjtest11',
            userType: 0,
            isFranchise: 0,
            number: '1011',
          },
          {
            subUsers: null,
            id: 3122012,
            account: 'cyjtest12',
            address: '福建省福州市111',
            company: '批发仓库',
            userType: 0,
            isFranchise: 1,
            number: '1012',
          },
          {
            subUsers: null,
            id: 3122013,
            account: 'cyjtest13',
            address: '福建省福州市111',
            company: 'cyjtest13-烘焙生产车间2',
            userType: 0,
            isFranchise: 1,
            number: '1013',
          },
          {
            subUsers: null,
            id: 3122014,
            account: 'cyjtest14',
            address: '福建省福州市111',
            company: 'cyjtest14',
            userType: 0,
            isFranchise: 1,
            number: '1014',
          },
          {
            subUsers: [
              {
                subUsers: null,
                id: 3122121,
                account: 'cyjtest19',
                address: '福建省福州市111',
                company: 'cyjtest19',
                userType: null,
                isFranchise: 1,
                number: null,
              },
            ],
            id: 3122015,
            account: 'cyjtest15',
            address: '福建省福州市111',
            company: 'cyjtest15',
            userType: 0,
            isFranchise: 1,
            number: '1015',
          },
        ],
        id: 3122010,
        account: 'cyjtest10',
        address: '福建省福州市111',
        company: 'cyjtest10二级管理',
        userType: 0,
        isFranchise: 1,
        number: 'qy10',
      },
    ],
    id: 3122005,
    account: 'cyjtest5',
    address: '宁夏省银川市222',
    company: 'cyjtest5北京',
    userType: 0,
    isFranchise: null,
    number: '1005',
  },
  {
    subUsers: null,
    id: 3122006,
    account: 'cyjtest6',
    address: '福建省福州市111',
    company: 'cyjtest6--旧组装拆分',
    userType: 0,
    isFranchise: 1,
    number: '1006',
  },
  {
    subUsers: null,
    id: 3505867,
    account: '410000',
    address: '福建省厦门市1212',
    company: '41002',
    userType: 0,
    isFranchise: 1,
    number: null,
  },
  {
    subUsers: [
      {
        subUsers: null,
        id: 3122118,
        account: 'cyjtest16',
        address: '福建省福州市111',
        company: 'cyjtest16',
        userType: null,
        isFranchise: 1,
        number: null,
      },
      {
        subUsers: null,
        id: 3122119,
        account: 'cyjtest17',
        address: '福建省福州市111',
        company: 'cyjtest17',
        userType: null,
        isFranchise: 1,
        number: null,
      },
      {
        subUsers: null,
        id: 3122120,
        account: 'cyjtest18',
        address: '福建省福州市111',
        company: 'cyjtest18',
        userType: null,
        isFranchise: 1,
        number: null,
      },
      {
        subUsers: null,
        id: 5583813,
        account: 'test_202403201607',
        address: '福建省厦门市银豹开发测试漏单功能',
        company: '5583813开发测试漏单功能-抖音券',
        userType: 0,
        isFranchise: null,
        number: 'ybkf',
      },
    ],
    id: 3122166,
    account: 'cyjtest20',
    address: '福建省福州市sdasdasdas',
    company: 'cyjtest20',
    userType: 0,
    isFranchise: 1,
    number: null,
  },
]

// ---- tree build & counts ----

const buildTree = (stores: RawStore[]): StoreTreeNode[] => {
  const walk = (nodes: RawStore[]): StoreTreeNode[] => {
    return nodes.map((store) => {
      const children = store.subUsers ? walk(store.subUsers) : []
      const titleParts: string[] = []
      if (store.number) titleParts.push(store.number)
      if (store.company) titleParts.push(store.company)

      return {
        key: String(store.id),
        title: titleParts.join(' - '),
        raw: store,
        children: children.length ? children : undefined,
      }
    })
  }

  return walk(stores)
}

const fullTree = ref<StoreTreeNode[]>(buildTree(MOCK_STORES))

const computeTotalCounts = (nodes: StoreTreeNode[]): number => {
  let total = 0

  nodes.forEach((node) => {
    const children = node.children || []
    const childrenTotal = children.length ? computeTotalCounts(children) : 0
    const selfTotal = 1 + childrenTotal

    node.totalDescCount = selfTotal
    total += selfTotal
  })

  return total
}

computeTotalCounts(fullTree.value)

const allStoreIds = computed<string[]>(() => {
  const ids: string[] = []

  const walk = (nodes: StoreTreeNode[]) => {
    nodes.forEach((node) => {
      ids.push(node.key)
      if (node.children && node.children.length) {
        walk(node.children)
      }
    })
  }

  walk(fullTree.value)
  return ids
})

// ---- filters ----

const keyword = ref('')
const selectedStoreType = ref<string | undefined>(undefined)
const selectedTags = ref<string[]>([])

// draft values used inside filter panel; only applied on confirm
const draftKeyword = ref('')
const draftSelectedStoreType = ref<string | undefined>(undefined)
const draftSelectedTags = ref<string[]>([])

const STORE_TYPE_OPTIONS = [
  { label: '普通门店', value: 'normal' },
  { label: '仓库', value: 'warehouse' },
  { label: '直营店', value: 'direct' },
  { label: '加盟店', value: 'franchise' },
]

const STORE_TAG_OPTIONS = ['福建', '北京', '上海', '广东', '仓库门店', '销售门店'].map(
  (t: string) => ({
    label: t,
    value: t,
  }),
)

const matchesType = (store: RawStore, type: string | undefined): boolean => {
  if (!type) return true
  if (type === 'normal') return store.userType === 0
  if (type === 'warehouse') return (store.company || '').includes('仓库')
  if (type === 'direct') return store.isFranchise === 0
  if (type === 'franchise') return store.isFranchise === 1
  return true
}

const matchesTags = (store: RawStore, tags: string[]): boolean => {
  if (!tags.length) return true
  const text = `${store.address || ''}${store.company || ''}`
  return tags.every((tag: string) => text.includes(tag))
}

type SummaryTag = {
  key: string
  label: string
}

const filterPopoverVisible = ref(false)

const summaryTags = computed<SummaryTag[]>(() => {
  const tags: SummaryTag[] = []

  if (selectedStoreType.value) {
    const foundType = STORE_TYPE_OPTIONS.find((opt) => opt.value === selectedStoreType.value)
    if (foundType) {
      tags.push({ key: 'type', label: foundType.label })
    }
  }

  selectedTags.value.forEach((value: string) => {
    const found = STORE_TAG_OPTIONS.find(
      (opt: { label: string; value: string }) => opt.value === value,
    )
    if (found) {
      tags.push({ key: `tag:${value}`, label: found.label })
    }
  })

  const kw = keyword.value.trim()
  if (kw) {
    tags.push({ key: 'keyword', label: kw })
  }

  return tags
})

const draftSummaryTags = computed<SummaryTag[]>(() => {
  const tags: SummaryTag[] = []

  if (draftSelectedStoreType.value) {
    const foundType = STORE_TYPE_OPTIONS.find((opt) => opt.value === draftSelectedStoreType.value)
    if (foundType) {
      tags.push({ key: 'type', label: foundType.label })
    }
  }

  draftSelectedTags.value.forEach((value: string) => {
    const found = STORE_TAG_OPTIONS.find(
      (opt: { label: string; value: string }) => opt.value === value,
    )
    if (found) {
      tags.push({ key: `tag:${value}`, label: found.label })
    }
  })

  const kw = draftKeyword.value.trim()
  if (kw) {
    tags.push({ key: 'keyword', label: kw })
  }

  return tags
})

const filteredTree = computed<StoreTreeNode[]>(() => {
  const kw = keyword.value.trim().toLowerCase()
  const type = selectedStoreType.value
  const tags = selectedTags.value

  const matchStore = (s: RawStore): boolean => {
    const text =
      `${s.company || ''} ${s.account || ''} ${s.address || ''} ${s.number || ''}`.toLowerCase()
    if (kw && !text.includes(kw)) return false
    if (!matchesType(s, type)) return false
    if (!matchesTags(s, tags)) return false
    return true
  }

  const filterNodes = (nodes: StoreTreeNode[]): StoreTreeNode[] => {
    const result: StoreTreeNode[] = []

    nodes.forEach((node) => {
      const children = node.children ? filterNodes(node.children) : []
      if (matchStore(node.raw) || children.length) {
        result.push({ ...node, children })
      }
    })

    return result
  }

  const tree = filterNodes(fullTree.value)
  computeTotalCounts(tree)
  return tree
})

// 当前筛选结果下可见门店的 key 列表
const visibleStoreIds = computed<string[]>(() => {
  const ids: string[] = []

  const walk = (nodes: StoreTreeNode[]) => {
    nodes.forEach((node) => {
      ids.push(node.key)
      if (node.children && node.children.length) {
        walk(node.children)
      }
    })
  }

  walk(filteredTree.value)
  return ids
})

const handleRemoveSummaryTag = (key: string) => {
  if (key === 'type') {
    selectedStoreType.value = undefined
    return
  }

  if (key === 'keyword') {
    keyword.value = ''
    return
  }

  if (key.startsWith('tag:')) {
    const value = key.slice(4)
    selectedTags.value = selectedTags.value.filter((tag: string) => tag !== value)
  }
}

watch(
  () => filterPopoverVisible.value,
  (open: boolean) => {
    if (open) {
      draftKeyword.value = keyword.value
      draftSelectedStoreType.value = selectedStoreType.value
      draftSelectedTags.value = [...selectedTags.value]
    }
  },
)

// ---- selection ----

const localCheckedKeys = ref<string[]>([])

watch(
  () => props.open,
  (open: boolean) => {
    if (open) {
      localCheckedKeys.value = (props.selectedIds || []).map((id: number) => String(id))
    }
  },
)

const totalCount = computed(() => visibleStoreIds.value.length)
const selectedCount = computed(
  () => localCheckedKeys.value.filter((id: string) => visibleStoreIds.value.includes(id)).length,
)

const isAllChecked = computed(
  () => totalCount.value > 0 && selectedCount.value > 0 && selectedCount.value === totalCount.value,
)
const isIndeterminate = computed(
  () => selectedCount.value > 0 && selectedCount.value < totalCount.value,
)

const handleToggleAll = (e: any) => {
  if (e.target.checked) {
    const merged = new Set<string>(localCheckedKeys.value)
    visibleStoreIds.value.forEach((id: string) => merged.add(id))
    localCheckedKeys.value = Array.from(merged)
  } else {
    // 只取消当前筛选结果里的门店，其它已选门店保留
    localCheckedKeys.value = localCheckedKeys.value.filter(
      (id: string) => !visibleStoreIds.value.includes(id),
    )
  }
}

const handleOk = () => {
  const ids = localCheckedKeys.value.map((key: string) => Number(key))
  emit('update:selectedIds', ids)
  visible.value = false
}

const handleCancel = () => {
  visible.value = false
}

const handleSelectStoreType = (value: string | undefined) => {
  if (draftSelectedStoreType.value === value) {
    draftSelectedStoreType.value = undefined
  } else {
    draftSelectedStoreType.value = value
  }
}

const handleToggleTag = (value: string) => {
  const idx = draftSelectedTags.value.indexOf(value)
  if (idx >= 0) {
    draftSelectedTags.value.splice(idx, 1)
  } else {
    draftSelectedTags.value.push(value)
  }
}

const handleClearFilters = () => {
  draftKeyword.value = ''
  draftSelectedStoreType.value = undefined
  draftSelectedTags.value = []
}

const applyDraftFilters = () => {
  keyword.value = draftKeyword.value.trim()
  selectedStoreType.value = draftSelectedStoreType.value
  selectedTags.value = [...draftSelectedTags.value]
  filterPopoverVisible.value = false
}
</script>

<template>
  <a-modal
    :open="visible"
    title="选择门店"
    width="590px"
    wrap-class-name="store-selector-modal-wrap"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="store-filter-container">
      <div class="store-filter-trigger" @click="filterPopoverVisible = true">
        <template v-if="summaryTags.length">
          <a-space wrap>
            <a-tag
              v-for="tag in summaryTags"
              :key="tag.key"
              closable
              @close.stop="handleRemoveSummaryTag(tag.key)"
            >
              {{ tag.label }}
            </a-tag>
          </a-space>
        </template>
        <template v-else>
          <span class="store-filter-placeholder"
            ><SearchOutlined style="margin-right: 4px" />点击选择筛选条件</span
          >
        </template>
      </div>

      <div v-if="filterPopoverVisible" class="store-filter-panel">
        <div class="store-filter-popover">
          <div v-if="draftSummaryTags.length" class="store-filter-popover-tags">
            <a-space wrap>
              <a-tag v-for="tag in draftSummaryTags" :key="tag.key">
                {{ tag.label }}
              </a-tag>
            </a-space>
          </div>

          <div class="store-filter-popover-row">
            <a-input
              v-model:value="draftKeyword"
              placeholder="搜索门店名称、编号、地址"
              allow-clear
            />
          </div>

          <div class="store-filter-group">
            <div class="store-filter-group-label">门店类型（单选）</div>
            <div class="store-filter-group-tags">
              <a-tag
                v-for="opt in STORE_TYPE_OPTIONS"
                :key="opt.value"
                :class="[
                  'store-filter-tag',
                  { 'store-filter-tag-active': draftSelectedStoreType === opt.value },
                ]"
                @click="handleSelectStoreType(opt.value)"
              >
                {{ opt.label }}
              </a-tag>
            </div>
          </div>

          <div class="store-filter-group">
            <div class="store-filter-group-label">门店标签（多选）</div>
            <div class="store-filter-group-tags">
              <a-tag
                v-for="opt in STORE_TAG_OPTIONS"
                :key="opt.value"
                :class="[
                  'store-filter-tag',
                  { 'store-filter-tag-active': draftSelectedTags.includes(opt.value) },
                ]"
                @click="handleToggleTag(opt.value)"
              >
                {{ opt.label }}
              </a-tag>
            </div>
          </div>

          <div class="store-filter-popover-footer">
            <a-button size="small" @click="handleClearFilters">清空</a-button>
            <a-button type="primary" size="small" @click="applyDraftFilters"> 确定 </a-button>
          </div>
        </div>
      </div>
    </div>

    <div class="store-tree-container">
      <a-empty v-if="!filteredTree.length" description="暂无门店数据" />
      <a-tree
        v-else
        checkable
        :tree-data="filteredTree"
        v-model:checkedKeys="localCheckedKeys"
        :field-names="{ title: 'title', key: 'key', children: 'children' }"
        default-expand-all
      >
        <template #title="{ dataRef }">
          <div class="store-tree-title">
            <span class="store-tree-title-main">{{ dataRef.title }}</span>
            <span
              v-if="dataRef.totalDescCount && dataRef.totalDescCount > 1"
              class="store-tree-desc-count"
            >
              {{ dataRef.totalDescCount }}
            </span>
          </div>
        </template>
      </a-tree>
    </div>

    <template #footer>
      <div style="display: flex; justify-content: space-between; align-items: center">
        <a-checkbox
          :indeterminate="isIndeterminate"
          :checked="isAllChecked"
          @change="handleToggleAll"
        >
          全选 {{ selectedCount }}/{{ totalCount }}
        </a-checkbox>

        <div>
          <a-button @click="handleCancel">取消</a-button>
          <a-button type="primary" style="margin-left: 8px" @click="handleOk"> 确定 </a-button>
        </div>
      </div>
    </template>
  </a-modal>
</template>

<style scoped>
.store-filter-container {
  position: relative;
}

.store-filter-trigger {
  border-top: 1px solid #f0f0f0;
  border-radius: 0px;
  padding: 8px 16px;
  cursor: pointer;
  background: rgb(250, 250, 250);
}

.store-filter-trigger :deep(.ant-space) {
  margin-bottom: 0 !important;
}

.store-filter-trigger :deep(.ant-tag),
.store-filter-panel :deep(.ant-tag) {
  font-size: 14px;
  height: 32px;
  line-height: 32px;
  border-radius: 2px;
}

.store-filter-placeholder {
  color: #999;
  font-size: 14px;
}

.store-filter-panel {
  position: absolute;
  width: 100%;
  padding: 16px;
  left: 0;
  right: 8px;
  top: -65px;
  background: #fff;
  box-shadow: 0px 8px 7px 7px rgba(0, 0, 0, 0.08);
  border-radius: 0 0 4px 4px;
  z-index: 1110;
}

.store-filter-placeholder {
  display: inline-flex;
  align-items: center;
  color: #999;
  font-size: 14px;
}
store-filter-popover {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px;
}

.store-filter-popover-tags {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.store-filter-popover-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.store-filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.store-filter-group-label {
  font-size: 14px;
  color: #999;
  margin: 4px 0;
}

.store-filter-group-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.store-filter-tag {
  cursor: pointer;
  user-select: none;
  font-size: 14px;
}

.store-filter-tag-active {
  color: #0088dd;
  border-color: #0088dd;
  background-color: #e6f4ff;
}

.store-filter-popover-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.store-tree-container {
  max-height: 360px;
  overflow: auto;
  border: 1px solid #f0f0f0;
  width: 100%;
  box-sizing: border-box;
  padding: 0 0px 16px;
}

.store-tree-container :deep(.ant-tree-node-content-wrapper) {
  flex: 1;
}
:deep(.store-selector-modal-wrap .ant-modal-content) {
  padding: 0 !important;
}
.store-tree-container :deep(.ant-tree-treenode) {
  position: relative;
  width: 100%;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.store-tree-title {
  display: block;
  width: 100%;
  padding-right: 32px;
}

.store-tree-title-main {
  min-width: 0;
  color: #666;
  font-size: 14px;
  font-family:
    Helvetica, Tahoma, Arial, 'Hiragino Sans GB', 'Hiragino Sans GB W3', 'Microsoft YaHei', STXihei,
    STHeiti, Heiti, SimSun, sans-serif;
}

.store-tree-desc-count {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #555;
}
</style>
<style>
.store-selector-modal-wrap .ant-modal-content {
  padding: 0 !important;
}

.store-selector-modal-wrap .ant-modal .ant-modal-title {
  padding: 18px;
}

.store-selector-modal-wrap .ant-modal-footer {
  padding: 0 18px 18px 18px;
}
</style>

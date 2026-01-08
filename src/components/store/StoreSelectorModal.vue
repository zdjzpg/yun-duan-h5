<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type RawStore = {
  subUsers: RawStore[] | null
  id: number
  account: string
  address: string
  company: string
  userType: number | null
  isFranchise: number | null
  number: string | null
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

const visible = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val),
} as any)

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

const formatStoreLabel = (store: RawStore): string => {
  const num = store.number || ''
  const name = store.company || store.account
  return num ? `${num} - ${name}` : name
}

const buildTree = (list: RawStore[]): StoreTreeNode[] =>
  list.map((item) => ({
    key: String(item.id),
    title: formatStoreLabel(item),
    raw: item,
    children: item.subUsers ? buildTree(item.subUsers) : undefined,
  }))

const fullTree = ref<StoreTreeNode[]>(buildTree(MOCK_STORES))

const computeTotalCounts = (nodes: StoreTreeNode[]): number => {
  let total = 0

  nodes.forEach((node) => {
    let selfTotal = 1

    if (node.children && node.children.length) {
      const childTotal = computeTotalCounts(node.children)
      selfTotal += childTotal
    }

    node.totalDescCount = selfTotal
    total += selfTotal
  })

  return total
}

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

const STORE_TYPE_OPTIONS = [
  { label: '普通门店', value: 'normal' },
  { label: '仓库', value: 'warehouse' },
  { label: '直营店', value: 'direct' },
  { label: '加盟店', value: 'franchise' },
]

const STORE_TAG_OPTIONS = [
  '福建省',
  '宁夏回族自治区',
  '江西省',
  '新疆维吾尔自治区',
  '湖南省',
  '湖北省',
  '香港特别行政区',
  '湖北省',
  '贵州省',
  '广西',
  '云南省',
  '北京市',
  '天津市',
  '第三方',
  '批发门店',
  '销售门店',
  '仓库门店',
  '本地经销商',
].map((t) => ({ label: t, value: t }))

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
  return tags.every((tag) => text.includes(tag))
}

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

// ---- selection ----

const localCheckedKeys = ref<string[]>([])

watch(
  () => props.open,
  (open) => {
    if (open) {
      localCheckedKeys.value = (props.selectedIds || []).map((id: number) => String(id))
    }
  },
)

const totalCount = computed(() => allStoreIds.value.length)
const selectedCount = computed(() => localCheckedKeys.value.length)

const isAllChecked = computed(
  () => selectedCount.value > 0 && selectedCount.value === totalCount.value,
)
const isIndeterminate = computed(
  () => selectedCount.value > 0 && selectedCount.value < totalCount.value,
)

const handleToggleAll = (e: any) => {
  if (e.target.checked) {
    localCheckedKeys.value = [...allStoreIds.value]
  } else {
    localCheckedKeys.value = []
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
    <div style="margin-bottom: 16px; display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px">
      <a-input
        v-model:value="keyword"
        placeholder="搜索门店名称、编号、地址"
        allow-clear
        style="width: 180px"
      />
      <a-select
        v-model:value="selectedStoreType"
        :options="STORE_TYPE_OPTIONS"
        allow-clear
        placeholder="门店类型"
        style="width: 150px"
      />
      <a-select
        v-model:value="selectedTags"
        :options="STORE_TAG_OPTIONS"
        mode="multiple"
        :max-tag-count="1"
        allow-clear
        placeholder="门店标签"
        style="min-width: 190px; flex: 1"
      />
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
.store-tree-container {
  max-height: 360px;
  overflow: auto;
  border: 1px solid #f0f0f0;

  width: 100%;
  box-sizing: border-box;
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
/* .store-tree-container :deep(.ant-tree-treenode) {
  border-bottom: 1px solid #ddd;
} */
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
  right: 0;
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

# Hooks 目录说明

> 组合式 API Hook 是把常用逻辑（请求、表单、状态机）提炼成函数，便于让 AI 或开发者快速复用，减少在组件里堆叠样板代码。

## 目录约定
- Hook 文件命名使用 `useXxx.ts`，例如 `useVenueList.ts`、`useUploadQueue.ts`。
- 每个 Hook 至少导出一个 `function useXxx()`，返回值应为对象，包含响应式 state、方法、以及需要暴露的 computed。
- 涉及接口调用时，需直接复用 `src/api` 中的函数和 `src/types` 类型，避免在 Hook 内写死 URL。

## 推荐内容
- **数据获取类**：如 `useVenueList`（封装分页、关键字搜索、状态筛选），内部调用 `fetchVenues` 并处理 loading/error。
- **权限/鉴权类**：如 `useAuthGuard`（读取 token、跳转登录），可结合 `router.beforeEach`。
- **表格列定制类**：`useTableColumnSetting` 统一管理列显隐、默认隐藏、强制展示与 `localStorage` 持久化，可直接与 `TableColumnSetting` 组件搭配。

## 模板示例
```ts
import { ref } from 'vue'
import { fetchVenues, type VenueListRequest, type VenueListResponse } from '@/api/theaterVenue'

export function useVenueList() {
  const loading = ref(false)
  const list = ref<VenueListResponse['list']>([])
  const pagination = ref({ page: 1, pageSize: 10, total: 0 })

  async function load(params: VenueListRequest = {}) {
    loading.value = true
    try {
      const result = await fetchVenues({ page: pagination.value.page, pageSize: pagination.value.pageSize, ...params })
      list.value = result.list
      pagination.value = { page: result.page, pageSize: result.pageSize, total: result.total }
    } finally {
      loading.value = false
    }
  }

  return {
    list,
    loading,
    pagination,
    load,
  }
}
```

> 将来新增 Hook 后，请把用法/入参与返回值记录在此目录 README，方便 AI/同事在生成组件前先了解可复用的逻辑。

# 演出管理（Theater/Shows）API 说明（后端真实接口参考）

> 本文档基于前端 `src/api/endpoints/theater/types.ts` 与 `src/api/endpoints/show/types.ts` 的类型定义，
> 直接描述「多场馆 / 多票档配置」下后端需要支持的数据结构和字段，不涉及历史实现细节。
> 场馆相关接口说明见 `docs/API_MOCK_THEATER.md`，演出管理接口与之保持相同的返回包裹结构与错误码约定。

---

## 一、通用约定

- 基础路径：`/theater/shows`
- HTTP 动词：
  - 列表 / 详情：`GET`
  - 新建：`POST`
  - 修改：`PATCH`
  - 删除：`DELETE`
- 统一返回结构（与场馆模块一致）：

```json
{
  "successed": true,
  "msg": "",
  "code": 0,
  "data": {}
}
```

- 本文档中的「请求体 / 响应体」均指 `data` 字段内部的业务结构。

---

## 二、演出基础数据模型

以下 TypeScript 类型定义位于 `src/types/theater.ts`，是演出管理相关接口的基础模型。

### 1. 枚举

```ts
export type ShowType =
  | 'live_show'   // 实景演出
  | 'musical'     // 音乐剧
  | 'drama'       // 话剧
  | 'concert'     // 演唱会
  | 'other'       // 其它

export type ShowStatus =
  | 'draft'       // 放入仓库
  | 'on_sale'     // 上架
  | 'off_sale'    // 下架
  | 'finished'    // 已结束
```

### 2. 演出信息 `Show`

```ts
export interface Show {
  id: string
  venueId: string          // 默认主场馆 ID（单场馆场景）
  venueName?: string       // 场馆名称（列表/详情展示用）

  name: string             // 演出名称
  type: ShowType           // 演出类型

  coverImage?: string[]    // 封面图 URL 数组
  description?: string     // 简介
  status: ShowStatus       // 状态：draft/on_sale/off_sale/finished

  sessionCount?: number    // 场次数量（统计字段）
  nextSessionTime?: string // 最近开演时间（统计字段）
  createdAt: string        // 创建时间（yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss）
}
```

### 3. 场次信息 `ShowSession`

```ts
export interface ShowSession {
  id: string
  showId: string
  venueId: string          // 该场次实际所在场馆 ID，可与 Show.venueId 不同（支持多场馆）

  date: string             // 演出日期：yyyy-MM-dd
  startTime: string        // 开演时间：HH:mm
  durationMinutes: number  // 演出时长（分钟）
  openTime?: string        // 开场时间（观众入场时间），可不填
  status?: string          // 场次状态（预留，可按需扩展）
  createdAt: string
  updatedAt: string
}
```

### 4. 票档信息 `ShowPriceTier`

```ts
export interface ShowPriceTier {
  id: string
  showId: string

  name: string             // 票档名称，例如：VIP、A区、池座区
  price: number            // 票面价格（单位：元）
  zoneIds?: string[]       // 关联场馆座区 ID 列表（按区售卖时使用）
  color?: string           // 颜色标识（用于前端渲染）
  remark?: string          // 备注

  createdAt: string
  updatedAt: string
}
```

### 5. 销售规则 `ShowSalesRule`

```ts
export interface ShowSalesRule {
  showId: string

  // 开售时间
  saleStartType: 'immediate' | 'scheduled'
  saleStartTime?: string              // saleStartType = 'scheduled' 时要求

  // 停售时间
  saleEndType: 'before_show' | 'scheduled'
  saleEndMinutesBeforeShow?: number   // saleEndType = 'before_show' 时要求
  saleEndTime?: string                // saleEndType = 'scheduled' 时要求

  // 退票相关
  allowRefund: boolean
  refundDeadlineType?: 'before_show' | 'scheduled'
  refundDeadlineHoursBeforeShow?: number
  refundDeadlineTime?: string

  // 单笔订单购买限制
  maxPurchasePerOrder: number
}
```

> 说明：一个演出支持多场次、多票档：
> - `ShowSession[]` 表示所有场次，场次维度可以绑定不同场馆；
> - `ShowPriceTier[]` 表示演出级票档，后续通过座位-票档映射细化到具体座位。

---

## 三、演出管理主接口（/theater/shows）

前端调用封装见 `src/api/show.ts`。

### 1. 演出列表

- **URL**：`GET /theater/shows`
- **Query 参数**（`ShowListRequest`）：

```ts
export type ShowListRequest = {
  page?: number         // 页码（从 1 开始）
  pageSize?: number     // 每页数量
  keyword?: string      // 搜索关键字（演出名称）
  venueId?: string      // 场馆筛选
  status?: ShowStatus   // 状态筛选
}
```

- **响应体**（`ShowListResponse`，对应 `data`）：

```ts
export type ShowListResponse = {
  list: Show[]
  total: number
  page: number
  pageSize: number
}
```

### 2. 创建演出

- **URL**：`POST /theater/shows`
- **请求体**（`CreateShowRequest`）：

```ts
export type CreateShowRequest = {
  // 基本信息
  name: string
  venueId: string
  type: ShowType
  coverImage?: string[]
  description?: string

  // 详情文案
  detailsIntro?: string           // 演出介绍
  detailsBookingRule?: string     // 预订规则
  detailsRefundRule?: string      // 退改规则
  detailsSafetyNotice?: string    // 安全须知
  detailImages?: string[]         // 详情图片 URL 列表

  // 状态
  status: ShowStatus              // 新建时一般为 draft

  // 场次列表（必填，至少一条）
  sessions?: Array<{
    date: string                  // yyyy-MM-dd
    startTime: string             // HH:mm
    durationMinutes: number       // 时长（分钟）
    openTime?: string             // 开场时间，可选
  }>

  // 票档列表（必填，至少一条）
  priceTiers?: Array<{
    name: string                  // 票档名称
    price: number                 // 价格（元）
    zoneIds?: string[]            // 关联场馆座区 ID 列表
    color?: string                // 前端展示颜色
    remark?: string               // 备注
  }>

  // 销售规则（整场演出级别）
  salesRule?: {
    // 开售/停售
    saleStartType: 'immediate' | 'scheduled'
    saleStartTime?: string

    saleEndType: 'before_show' | 'scheduled'
    saleEndMinutesBeforeShow?: number
    saleEndTime?: string

    // 退票相关
    allowRefund: boolean
    refundDeadlineType?: 'before_show' | 'scheduled'
    refundDeadlineHoursBeforeShow?: number
    refundDeadlineTime?: string

    // 单笔订单最大购票数
    maxPurchasePerOrder: number
  }
}
```

- **响应体**（`CreateShowResponse`）：

```ts
export type CreateShowResponse = {
  id: string    // 新建演出 ID
}
```

### 3. 演出详情

- **URL**：`GET /theater/shows/{id}`
- **响应体**（`ShowDetailResponse`，对应 `data`）：

```ts
export type ShowDetailResponse = {
  show: Show                   // 演出基础信息
  sessions: ShowSession[]      // 场次列表
  priceTiers: ShowPriceTier[]  // 票档列表
  salesRule: ShowSalesRule     // 销售规则

  // 可选：座位-票档映射，用于精确座位场景
  seatPriceTierMapping?: Record<string, string> // seatId -> priceTierId
}
```

### 4. 更新演出

- **URL**：`PATCH /theater/shows/{id}`
- **请求体**（`UpdateShowRequest`）：

```ts
export type UpdateShowRequest = Partial<CreateShowRequest> & {
  id: string    // 演出 ID
}
```

- **响应体**：与详情接口一致（`ShowDetailResponse`）。

### 5. 更新演出状态

- **URL**：`PATCH /theater/shows/{id}/status`
- **请求体**（`UpdateShowStatusRequest`）：

```ts
export type UpdateShowStatusRequest = {
  id: string        // 演出 ID
  status: ShowStatus
}
```

- **响应体**：`ShowDetailResponse`

> 常见状态流转：
> - `draft` → `on_sale`：上架；
> - `on_sale` → `off_sale`：人工下架；
> - `on_sale`/`off_sale` → `finished`：演出结束（可由后台定时或人工触发）。

### 6. 删除演出

- **URL**：`DELETE /theater/shows/{id}`
- **响应体**（`DeleteShowResponse`）：

```ts
export type DeleteShowResponse = {
  success: boolean
}
```

> 建议实现为逻辑删除（保留数据以便对账），前端仅需根据 `success` 判断是否删除成功。

### 7. 批量生成场次

- **URL**：`POST /theater/shows/{id}/sessions/batch`
- **请求体**（`BatchCreateSessionsRequest`）：

```ts
export type BatchCreateSessionsRequest = {
  showId: string           // 演出 ID

  startDate: string        // 日期范围：开始（yyyy-MM-dd）
  endDate: string          // 日期范围：结束（yyyy-MM-dd）

  weekdays: number[]       // 星期过滤：0-6 表示周日-周六

  startTime: string        // 每日统一开演时间：HH:mm
  durationMinutes: number  // 时长（分钟）
  openTime?: string        // 开场时间（可选）
}
```

- **响应体**（`BatchCreateSessionsResponse`）：

```ts
export type BatchCreateSessionsResponse = {
  count: number            // 生成的场次数量
  sessions: ShowSession[]  // 实际生成的场次列表
}
```

> 建议：
> - 后端需要避免生成重复的场次（同一场次日期 + 时间组合重复时需跳过或返回错误）；
> - 生成的场次应持久化到与演出关联的 ShowSession 表中。

---

## 四、票档与座位映射相关字段（供后端建模参考）

以下类型定义位于 `src/api/endpoints/show/types.ts`，当前在前端仅作为 Mock 使用。后端在实现真实接口时可按此字段设计对应的 DTO / 实体。

> 注：本节**只约定字段结构**，具体 URL 可以按后端风格设计（例如：挂在 `/theater/shows/{showId}/price-tiers`、`/theater/shows/{showId}/seat-mapping` 等）。

### 1. 票档模型 `PriceTier`

```ts
export type PriceTier = {
  id: string
  showId: string

  name: string      // 票档名称（如：VIP / A区 / B区）
  price: number     // 票价（单位：分）
  color: string     // 颜色，用于前端渲染
  remark?: string   // 备注
  order: number     // 显示顺序

  createdAt: string
  updatedAt?: string
}
```

与上文 `ShowPriceTier` 的差异：
- 这里的 `price` 单位是「分」（更适合对账与计算）；
- `order` 为必填，用于排序；
- 该模型更偏向「演出座位图配置」场景，可以视为内部配置表。

### 2. 座位-票档映射 `ShowSeatPrice`

```ts
export type ShowSeatPrice = {
  id: string
  showId: string
  seatId: string       // 引用场馆级座位 VenueSeat.id
  priceTierId: string  // 引用 PriceTier.id
  createdAt: string
}
```

### 3. 票档 CRUD 请求 / 响应

```ts
export type CreatePriceTierRequest = {
  showId: string
  name: string
  price: number        // 单位：分
  color: string
  remark?: string
  order?: number       // 可选，不传则由后端自动排在最后
}

export type CreatePriceTierResponse = {
  id: string
  showId: string
  name: string
  price: number
  color: string
  order: number
  createdAt: string
}

export type UpdatePriceTierRequest = {
  name?: string
  price?: number
  color?: string
  remark?: string
  order?: number
}

export type UpdatePriceTierResponse = PriceTier

export type DeletePriceTierResponse = {
  success: boolean
  deletedId: string
}

export type GetPriceTierListResponse = {
  list: PriceTier[]
  total: number
}
```

### 4. 批量分配座位到票档

```ts
export type BatchAssignSeatsToPriceTierRequest = {
  showId: string
  priceTierId: string
  seatIds: string[]    // 场馆级座位 ID 列表
}

export type BatchAssignSeatsToPriceTierResponse = {
  created: number      // 新增映射条数
  priceTierId: string
  showId: string
}
```

### 5. 按座区分配票档

```ts
export type AssignSeatsByZoneRequest = {
  showId: string
  priceTierId: string
  zoneId: string       // 场馆座区 ID
}

export type AssignSeatsByZoneResponse = {
  created: number
  zoneId: string
  zoneName: string
  priceTierId: string
}
```

> 说明：
> - 后端实现时，需要根据 `zoneId` 在场馆座位表中查询所有座位，并调用「批量分配」逻辑；
> - 前端只关心 `created` 数量和 `zoneName` 用于提示。

### 6. 查询座位-票档映射与统计

```ts
export type GetSeatPriceMappingResponse = {
  list: ShowSeatPrice[]
  total: number
}

export type PriceTierStats = {
  priceTierId: string
  priceTierName: string
  assignedCount: number   // 已分配座位数量
  totalRevenue: number    // 理论总收入（按票价 * 已分配座位数）
}

export type GetShowSeatStatsResponse = {
  totalSeats: number
  assignedSeats: number
  unassignedSeats: number
  priceTiers: PriceTierStats[]
}
```

### 7. 更新演出级座位禁用状态

```ts
export type UpdateShowSeatStatusRequest = {
  showId: string
  seatIds: string[]      // 需要更新的座位 ID 列表
  isDisabled: boolean    // true=禁用，false=恢复
  reason?: 'vip_reserved' | 'equipment' | 'staged_release' | 'maintenance' | 'other'
}

export type UpdateShowSeatStatusResponse = {
  success: boolean
  affectedCount: number  // 实际影响的座位数量
}
```

> 说明：
> - 该接口用于在演出维度禁用/恢复指定座位（例如 VIP 保留、设备占用、分批放票等）；
> - 具体的禁用状态存储设计（单独表或扩展表）由后端决定，前端只依赖字段语义。

---

## 五、小结

- 演出模型支持多场次、多票档：一个 `Show` 可以关联多个 `ShowSession` 和多个 `ShowPriceTier`；
- `CreateShowRequest` / `UpdateShowRequest` / `ShowDetailResponse` 中的字段即为后端建表与实现真实接口的依据；
- 票档与座位映射、演出级座位禁用等结构在 `src/api/endpoints/show/types.ts` 中有完整类型定义，可直接作为后端模型参考。 

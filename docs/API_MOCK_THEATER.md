# 剧场业务 Mock 接口说明（B 项目）

> 说明：本文档描述 B 项目中通过 `axios-mock-adapter` 配置的“场馆 / 演出”相关 Mock 接口，方便后端按相同的 URL、HTTP 方法、请求 / 响应结构实现真实服务。
>
> 代码来源：`src/api/setup-mocks.ts`、`src/api/endpoints/theater/mocks.ts`、`src/api/endpoints/theater/types.ts`、`src/types/theater.ts`

---

## 一、通用约定

- 基础 URL：前端通过统一的 `axios` 实例调用，这里只列相对路径，例如 `/theater/venues`。
- 响应包装：所有接口统一返回：

  ```json
  {
    "code": "SUCCESS" | "VALIDATION_ERROR" | "NOT_FOUND" | "...",
    "message": "描述信息",
    "data": <具体业务数据>
  }
  ```

  其中 `code` 的枚举定义见 `src/api/shared/response-codes.ts`，当前 Mock 主要使用：

  - `"SUCCESS"`：请求成功
  - `"VALIDATION_ERROR"`：参数校验失败（例如场馆重名）
  - `"NOT_FOUND"`：资源不存在

- 日期 / 时间字段：
  - 仅日期（如 `createdAt` / `updatedAt` / `lastCheckedAt`）：统一为字符串 `YYYY-MM-DD`，例：`2025-01-01`
  - 需包含日期和时间的字段（如 `nextSessionTime`）：统一为字符串 `YYYY-MM-DD HH:mm:ss`，例：`2025-12-15 19:30:00`，不再使用带 `T` / `Z` 的 ISO 格式

- ID：示例中为字符串，如 `venue-001`、`show-001`。真实接口只要保证唯一且类型为字符串即可（可以是数据库主键的字符串形式）。

---

## 二、场馆管理（Venue）

### 0. 公共数据模型（场馆相关）

以下是 Mock 中使用的与场馆相关的核心数据结构，后端可以据此设计对应的实体 / DTO。

#### 0.1 场馆容量 / 类型 / 状态枚举

- `VenueCapacityType`（容量模式）：
  - `"free_seating"`：自由站席 / 不按座位售票，只记录总容量
  - `"zone_capacity"`：按座区容量配置，不记录具体座位
  - `"precise_seat"`：精确座位模式，有完整座位表和座位图

- `VenueType`（场馆类型）：
  - `"indoor_theater"`：室内剧场
  - `"outdoor_scene"`：户外实景
  - `"multifunctional"`：多功能厅
  - `"other"`：其他

- `VenueStatus`（场馆状态）：
  - `"active"`：启用
  - `"inactive"`：停用

- `VenueSeatStatus`（场馆层面的座位“物理状态”）：
  - `"available"`：可用座位
  - `"disabled"`：禁用座位（设备占用、维护等原因）

- `SeatDisabledReason`（座位禁用原因）：
  - `"equipment"`：设备占用（音响、摄像机位等）
  - `"maintenance"`：维护中（座椅损坏、临时维修等）
  - `"other"`：其他原因

- `SeatLabel`（座位标签，用于无障碍 / VIP 等标识）：
  - `"accessible"`：无障碍座
  - `"vip"`：贵宾座

#### 0.2 场馆对象 `Venue`

```ts
interface Venue {
  id: string                 // 场馆 ID
  merchantId: string         // 所属商户 ID
  scenicId?: string          // 所属景区 ID（可选）
  name: string               // 场馆名称
  type?: 'indoor_theater' | 'outdoor_scene' | 'multifunctional' | 'other' // 场馆类型
  address?: string           // 场馆地址
  description?: string       // 场馆简介

  capacityType: 'free_seating' | 'zone_capacity' | 'precise_seat'         // 容量模式
  totalCapacity: number      // 总容量（所有模式下都要求维护）
  status: 'active' | 'inactive'                                           // 场馆状态

  isLocked?: boolean         // 座位结构是否被锁定（只用于列表展示，表示已有订单 / 演出引用）
  referencedShowCount?: number // 引用该场馆的演出数量（只用于列表展示）

  // 以下字段与容量模式相关：
  zones?: VenueZone[]        // zone_capacity / precise_seat 模式下使用
  seats?: VenueSeat[]        // 仅 precise_seat 模式使用
  floors?: VenueFloor[]      // 仅 precise_seat 模式使用
  seatMapConfig?: VenueSeatMapConfig // 仅 precise_seat 模式使用，座位图画布及舞台配置

  createdAt: string          // 创建日期 YYYY-MM-DD
  updatedAt: string          // 更新时间 YYYY-MM-DD
}
```

#### 0.3 场馆子对象

```ts
// 座区信息
interface VenueZone {
  id: string
  venueId: string
  name: string               // 座区名称，例如“VIP 区”“A 区”
  shortName?: string         // 座区简称，例如“VIP”“A”
  color?: string             // 座区颜色（座位图展示用）
  floor?: string             // 楼层文本，例如“一层”“二层”
  floorId?: string           // 关联的楼层 ID（见 VenueFloor.id）
  capacity?: number          // 仅 zone_capacity 模式使用：该座区总容量
  sort?: number              // 座区排序
  rows?: number              // 仅精确座位模式：行数（用于批量生成）
  seatsPerRow?: number       // 仅精确座位模式：每行座位数（用于批量生成）
  createdAt: string
  updatedAt: string
}

// 精确座位（仅 precise_seat）
interface VenueSeat {
  id: string
  venueId: string
  floorId: string
  zoneId: string
  rowLabel: string           // 排号，例如“A 排”“1 排”
  seatLabel: string          // 座号，例如“1 号”“A 座”
  status: VenueSeatStatus    // 座位物理状态（可用 / 禁用）
  disabledReason?: SeatDisabledReason // 禁用原因（仅在 status = 'disabled' 时有效）
  label?: SeatLabel          // 座位标签（无障碍、VIP 等）
  x: number                  // 座位在画布上的 X 坐标（像素）
  y: number                  // 座位在画布上的 Y 坐标（像素）
  createdAt: string
  updatedAt: string
}

// 楼层信息（仅 precise_seat）
interface VenueFloor {
  id: string
  name: string               // 楼层名称，例如“一层”“二层看台”
  order: number              // 楼层顺序
}

// 座位图配置（仅 precise_seat）
interface VenueSeatMapConfig {
  canvasWidth: number        // 画布宽度（像素）
  canvasHeight: number       // 画布高度（像素）
  backgroundImage?: string   // 背景图片 URL（可选）
  stage?: VenueStageConfig   // 舞台配置（可选）
}

interface VenueStageConfig {
  id: string
  name: string               // 舞台名称，例如“舞台方向”
  x: number                  // 舞台中心 X 坐标
  y: number                  // 舞台中心 Y 坐标
  shape: 'rect' | 'trapezoid' | 'arc' // 舞台形状
  width: number              // 宽度（像素）
  height: number             // 高度（像素）
  position: 'top-center'     // 在画布中的位置（目前固定为顶部居中）
  color?: string             // 舞台颜色（可选）
}
```

> 注：以上结构与 `src/types/theater.ts` 保持一致，Mock 返回的 `Venue` 对象即为该结构。

---

### 1. 场馆列表

- **Method**：`GET`  
- **URL**：`/theater/venues`
- **Query 参数**（`VenueListRequest`）：
  - `page?: number` 当前页码（默认 1）
  - `pageSize?: number` 每页数量（默认 10）
  - `keyword?: string` 按场馆名称模糊搜索
  - `status?: 'active' | 'inactive'` 场馆状态筛选
- **data 字段类型**：`VenueListResponse`

```ts
type VenueListResponse = {
  list: Venue[]
  total: number
  page: number
  pageSize: number
}
```

- **备注**：Mock 支持按 `keyword` 和 `status` 进行过滤。

### 2. 创建场馆

- **Method**：`POST`  
- **URL**：`/theater/venues`
- **请求体类型**：`CreateVenueRequest`（联合类型，根据容量模式区分）

公共字段（`CreateVenueBaseRequest`）：

- `name: string` 场馆名称（同一商户下需唯一）
- `type?: 'indoor_theater' | 'outdoor_scene' | 'multifunctional' | 'other'` 场馆类型
- `scenicId?: string` 所属景区 ID
- `address?: string` 场馆地址
- `description?: string` 场馆简介
- `capacityType: 'free_seating' | 'zone_capacity' | 'precise_seat'` 容量模式

按不同模式补充字段：

- 自由站席模式（`capacityType: 'free_seating'`）：
  - `totalCapacity: number` 总容量

- 按座区容量模式（`capacityType: 'zone_capacity'`）：
  - `zones: { name: string; capacity: number; sort?: number }[]` 座区容量配置

- 精确座位模式（`capacityType: 'precise_seat'`）：
  - `zones: { name: string; shortName?: string; color?: string; floor?: string; rows?: number; seatsPerRow?: number }[]`
  - `seats: { zoneId: string; rowLabel: string; seatLabel: string; status: VenueSeatStatus; label?: SeatLabel; x: number; y: number }[]`

- **data 字段类型**：`CreateVenueResponse`

```ts
type CreateVenueResponse = { id: string } // 新建场馆 ID
```

- **业务约束（Mock 已实现）**：同一名称的场馆不能重复创建，重名时返回 `code = 'VALIDATION_ERROR'`。

### 3. 场馆详情

- **Method**：`GET`  
- **URL**：`/theater/venues/{id}`
- **Path 参数**：
  - `id: string` 场馆 ID
- **data 字段类型**：`VenueDetailResponse`（即 `Venue` 对象）
- **说明**：
  - 精确座位模式下会包含完整的 `floors`、`zones`、`seats`、`seatMapConfig.stage` 信息，供座位图编辑器使用。

### 4. 更新场馆

- **Method**：`PUT`  
- **URL**：`/theater/venues/{id}`
- **Path 参数**：
  - `id: string` 场馆 ID
- **请求体类型**：`UpdateVenueRequest`

```ts
type UpdateVenueRequest = Partial<CreateVenueRequest> & { id: string }
```

- **data 字段**：更新后的 `Venue` 对象
- **业务约束**：更新名称时也会做重名校验，与创建场馆相同（重名返回 `VALIDATION_ERROR`）。

### 5. 更新场馆状态

- **Method**：`PATCH`  
- **URL**：`/theater/venues/{id}/status`
- **Path 参数**：
  - `id: string` 场馆 ID
- **请求体类型**：`UpdateVenueStatusRequest`

```ts
type UpdateVenueStatusRequest = {
  id: string
  status: 'active' | 'inactive'
}
```

- **data 字段**：更新后的 `Venue` 对象

### 6. 删除场馆

- **Method**：`DELETE`  
- **URL**：`/theater/venues/{id}`
- **Path 参数**：
  - `id: string` 场馆 ID
- **data 字段类型**：`DeleteVenueResponse`

```ts
type DeleteVenueResponse = { success: boolean }
```

- **约定**：
  - 实际环境中，如场馆已被演出引用或已有订单，应返回业务错误码并阻止删除；当前 Mock 直接删除并返回 `success = true`。

### 7. 场馆锁定状态

- **Method**：`GET`  
- **URL**：`/theater/venues/{id}/lock-status`
- **Path 参数**：
  - `id: string` 场馆 ID
- **data 字段类型**：`CheckVenueLockStatusResponse`

```ts
type VenueLockStatus = {
  venueId: string
  isLocked: boolean
  lockReason?: 'has_orders' | 'referenced_by_show' // 有订单 / 被演出引用
  referencedShowCount: number  // 引用该场馆的演出数量
  totalOrders: number          // 关联订单总数
  lastCheckedAt: string        // 最近一次检查时间（YYYY-MM-DD）
}
```

### 8. 复制场馆

- **Method**：`POST`  
- **URL**：`/theater/venues/copy`
- **请求体类型**：`CopyVenueRequest`

```ts
type CopyVenueRequest = {
  sourceVenueId: string      // 源场馆 ID
  newVenueName?: string      // 新场馆名称（可选，不传可由前端或后端按规则生成）
  copySeatData?: boolean     // 是否复制座位数据（仅精确座位模式有效）
}
```

- **data 字段类型**：`CopyVenueResponse`

```ts
type CopyVenueResponse = {
  newVenueId: string         // 新场馆 ID
  venue: Venue               // 新场馆完整信息
}
```

- **Mock 行为说明**：
  - 会复制源场馆的基础信息和容量配置：
    - `free_seating`：复制基础信息和 `totalCapacity`
    - `zone_capacity`：复制 `zones` 配置
    - `precise_seat`：复制 `floors`、`zones`、`seats`、`seatMapConfig`
  - 返回的新 `venue` 中的 ID、创建时间等字段会按 Mock 内部逻辑生成，仅用于前端联调参考。

---

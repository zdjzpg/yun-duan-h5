# 剧场业务 Mock 接口说明（b 项目）

> 说明：本文件描述 b 项目中通过 `axios-mock-adapter` 配置的剧场／演出相关 Mock 接口，便于后端按同样的 URL、方法、请求/响应结构实现真实服务。  
> 代码来源：`src/api/setup-mocks.ts`、`src/api/endpoints/theater/mocks.ts`、`src/api/endpoints/theater/types.ts`、`src/types/theater.ts`。

---

## 一、通用约定

- 基础 URL：前端通过统一的 `axios` 实例调用，这里仅列出相对路径，如 `/theater/venues`。
- 响应包装：所有接口统一返回
  ```json
  {
    "code": "SUCCESS" | "VALIDATION_ERROR" | "NOT_FOUND" | ...,
    "message": "描述信息",
    "data": <具体业务数据>
  }
  ```
  其中 `code` 枚举见 `src/api/shared/response-codes.ts`，当前 Mock 主要使用：
  - `"SUCCESS"`：请求成功
  - `"VALIDATION_ERROR"`：参数校验失败（例如场馆重名）
  - `"NOT_FOUND"`：资源不存在
- 日期/时间字段：
  - 日期（如 `createdAt` / `updatedAt` / `lastCheckedAt`）统一为字符串 `YYYY-MM-DD`，例如 `2025-01-01`。
  - 需要同时包含日期和时间的字段（如 `nextSessionTime`）统一为 `YYYY-MM-DD HH:mm:ss`，例如 `2025-12-15 19:30:00`，不再使用带 `T` / `Z` 的 ISO 格式。
- ID：示例中为字符串，如 `venue-001`、`show-001`，真实接口只要保证唯一且类型为字符串即可。

---

## 二、场馆管理（Venue）

### 1. 场馆列表

- **Method**：`GET`
- **URL**：`/theater/venues`
- **Query 参数**（`VenueListRequest`）：
  - `page?: number` 当前页码（默认 1）
  - `pageSize?: number` 每页数量（默认 10）
  - `keyword?: string` 按场馆名称模糊搜索
  - `status?: 'active' | 'inactive'` 场馆状态
- **data 字段类型**：`VenueListResponse`
  ```ts
  type VenueListResponse = {
    list: Venue[]
    total: number
    page: number
    pageSize: number
  }
  ```
- **备注**：
  - Mock 支持按 `keyword` 和 `status` 过滤。

### 2. 创建场馆

- **Method**：`POST`
- **URL**：`/theater/venues`
- **请求体类型**：`CreateVenueRequest`（联合类型，取决于容量模式）
  - 公共字段（`CreateVenueBaseRequest`）：
    - `name: string` 场馆名称（同一商户下唯一）
    - `type?: 'indoor_theater' | 'outdoor_scene'` 场馆类型
    - `scenicId?: string` 所属景区 ID
    - `address?: string` 地址
    - `description?: string` 简介
    - `capacityType: 'free_seating' | 'zone_capacity' | 'precise_seat'`
  - 自由站席模式（`capacityType: 'free_seating'`）：
    - `totalCapacity: number` 总容量
  - 按座区数量模式（`capacityType: 'zone_capacity'`）：
    - `zones: { name: string; capacity: number; sort?: number }[]`
  - 精确座位模式（`capacityType: 'precise_seat'`）：
    - `zones: { name: string; shortName?: string; color?: string; floor?: string; rows?: number; seatsPerRow?: number }[]`
    - `seats: { zoneId: string; rowLabel: string; seatLabel: string; status: VenueSeatStatus; label?: SeatLabel; x: number; y: number }[]`
- **data 字段类型**：`CreateVenueResponse`
  ```ts
  type CreateVenueResponse = { id: string }
  ```
- **业务约束（Mock 已实现）**：
  - 同一名称的场馆不能重复创建，重名返回 `code = 'VALIDATION_ERROR'`。

### 3. 场馆详情

- **Method**：`GET`
- **URL**：`/theater/venues/{id}`
- **Path 参数**：
  - `id: string` 场馆 ID
- **data 字段类型**：`VenueDetailResponse`（即 `Venue` 对象）
- **备注**：
  - 精确座位模式下会包含 `floors`、`zones`、`seats`、`seatMapConfig.stage` 等信息，供座位图编辑器使用。

### 4. 更新场馆

- **Method**：`PUT`
- **URL**：`/theater/venues/{id}`
- **Path 参数**：
  - `id: string` 场馆 ID
- **请求体类型**：`UpdateVenueRequest`
  ```ts
  type UpdateVenueRequest = Partial<CreateVenueRequest> & { id: string }
  ```
- **data 字段**：
  - 更新后的 `Venue` 对象
- **业务约束**：
  - 更新名称时也会做重名校验（同上，返回 `VALIDATION_ERROR`）。

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
- **data 字段**：
  - 更新后的 `Venue` 对象

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
  - 若场馆被演出引用或有订单，实际环境可返回业务错误码并阻止删除；Mock 当前直接删除。

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
    lockReason?: 'has_orders' | 'referenced_by_show'
    referencedShowCount: number
    totalOrders: number
    lastCheckedAt: string
  }
  ```

### 8. 复制场馆

- **Method**：`POST`
- **URL**：`/theater/venues/copy`
- **请求体类型**：`CopyVenueRequest`
  ```ts
  type CopyVenueRequest = {
    sourceVenueId: string
    /** 新场馆名称 */
    name: string
  }
  ```
- **data 字段类型**：`CopyVenueResponse`
  ```ts
  type CopyVenueResponse = {
    newVenueId: string
    venue: Venue
  }
  ```
- **说明**：
  - Mock 行为：复制源场馆的基础信息 + 容量配置（包括精确座位数据），生成一个新的 `Venue`。

---

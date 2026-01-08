# 剧场业务 API 说明（后端真实接口）

> 本文档基于 **UserWebApi** 的最新 DTO/Controller 实现整理，适配前端技术栈：**Vue3 + Vite + Axios**。
> - 控制器：`UserWebApi/Areas/Ticketing/Controllers/TicketingVenueController.cs`
> - DTO：`UserWebApi/Models/Dtos/Ticketing/TicketingVenueDto.cs`
> - 常量：`UserWebApi/Models/Const/Ticketing/TicketingVenueDtoConst.cs`
>
---

## 一、通用约定

### 1) 基础 URL
- 控制器路由：`/Ticketing/TicketingVenue/`
- 例如：`/Ticketing/TicketingVenue/VenueList`

### 2) 响应结构
后端统一返回 `ApiJsonResponse`（字段名小写）：

```json
{
  "successed": true,
  "msg": "",
  "code": 0,
  "data": {}
}
```

- `successed`：是否成功
- `msg`：错误提示或说明
- `code`：错误码（int，成功通常为 0）
- `data`：业务数据

### 3) ID 规则（非常重要）
- **新增项**：前端提交临时 ID，后端会生成真实 uid
  - floor：`"floor_xxxx"` 或 `"floor-xxxx"`
  - zone：`"zone_xxxx"` 或 `"zone-xxxx"`
  - seat：`"seat_xxxx"` 或 `"seat-xxxx"`
- **编辑项**：`id` 必须为数据库 `uid` 字符串形式
- 前端提交后应刷新详情获取真实 id

---

## 二、枚举与常量

### 1) 容量模式 `VenueCapacityType`
- `"free_seating"`：自由站席
- `"zone_capacity"`：按座区容量
- `"precise_seat"`：精确座位

### 2) 场馆类型 `VenueType`
- `"indoor_theater"`
- `"outdoor_scene"`
- `"multifunctional"`
- `"other"`

### 3) 场馆状态 `VenueStatus`
- `"active"`
- `"inactive"`

### 4) 座位状态 `VenueSeatStatus`
- `"available"`
- `"disabled"`

### 5) 舞台形状 `StageShape`
- `"rect"`
- `"trapezoid"`
- `"arc"`

### 6) 舞台位置 `StagePosition`
- `"top-center"`

---

## 三、数据模型（前端 TypeScript）

```ts
export interface Venue {
  id: string
  merchantId: string
  scenicId?: string
  name: string
  type?: 'indoor_theater' | 'outdoor_scene' | 'multifunctional' | 'other'
  address?: string
  description?: string

  capacityType: 'free_seating' | 'zone_capacity' | 'precise_seat'
  totalCapacity: number
  status: 'active' | 'inactive'

  // 仅详情返回
  zones?: VenueZone[]
  seats?: VenueSeat[]
  floors?: VenueFloor[]
  stage?: VenueStage

  // 后端当前返回为 string，可为空
  createdAt?: string
  updatedAt?: string // 格式：yyyy-MM-dd HH:mm:ss
}

export interface VenueZone {
  id: string
  venueId: string
  name: string
  shortName?: string
  color?: string
  floorId?: string
  capacity?: number
  sort?: number
}

export interface VenueSeat {
  id: string
  venueId: string
  floorId?: string
  zoneId: string
  rowLabel: string
  seatLabel: string
  status: 'available' | 'disabled'
  x: number
  y: number
  seatTypes?: number[] // 1=最佳观赏位，2=走道（与 DB: ticketingvenueseat.seatTypes 对应，逗号分隔）
}

export interface VenueFloor {
  id: string
  name: string
  order?: number
}

export interface VenueStage {
  id: string
  name: string
  x: number
  y: number
  shape: 'rect' | 'trapezoid' | 'arc'
  width: number
  height: number
  position: 'top-center'
  color?: string
}
```

---

## 四、接口列表

> 所有接口均为 **POST**（符合后端统一规范）。

### 1) 场馆列表
- **URL**：`/Ticketing/TicketingVenue/VenueList`
- **Request**
```ts
export interface VenueListRequest {
  page?: number
  pageSize?: number
  keyword?: string
  status?: 'active' | 'inactive'
}
```
- **Response.data**
```ts
export interface VenueListResponse {
  list: Venue[]
  total: number
  page: number
  pageSize: number
}
```

---

### 2) 保存场馆（创建/更新）
- **URL**：`/Ticketing/TicketingVenue/SaveVenue`
- **Request**
```ts
export interface SaveVenueRequest extends Venue {}
```

**关键规则**
- 新增场馆：`id` 为空或非数字字符串
- 编辑场馆：`id` 为真实 uid 字符串
- floor/zone/seat 使用临时 id 时必须按前缀规范提交
- 后端按 floor → zone → seat 顺序处理并修正 id
- 后端会重算：
  - `venue.floorNum/zoneNum/seatNum`
  - `floor.zoneNum/seatNum`
  - `zone.seatNum`

- **Response.data**
```ts
export interface SaveVenueResponse {
  id: string // 场馆 uid
}
```

---

### 3) 场馆详情
- **URL**：`/Ticketing/TicketingVenue/VenueDetail`
- **Request**
```ts
export interface VenueDetailRequest {
  id: string
}
```
- **Response.data**
```ts
export type VenueDetailResponse = Venue
```

---

### 4) 更新场馆状态
- **URL**：`/Ticketing/TicketingVenue/UpdateVenueStatus`
- **Request**
```ts
export interface UpdateVenueStatusRequest {
  id: string
  status: 'active' | 'inactive'
}
```
- **Response.data**
```ts
export type UpdateVenueStatusResponse = Venue
```

---

### 5) 删除场馆（逻辑删除）
- **URL**：`/Ticketing/TicketingVenue/DeleteVenue`
- **Request**
```ts
export interface DeleteVenueRequest {
  id: string
}
```
- **Response.data**
```ts
export interface DeleteVenueResponse {
  success: boolean
}
```

---

## 五、前端 Axios 调用示例

```ts
import axios from '@/api/axios'

export const venueApi = {
  list: (data: VenueListRequest) => axios.post('/Ticketing/TicketingVenue/VenueList', data),
  save: (data: SaveVenueRequest) => axios.post('/Ticketing/TicketingVenue/SaveVenue', data),
  detail: (id: string) => axios.post('/Ticketing/TicketingVenue/VenueDetail', { id }),
  updateStatus: (data: UpdateVenueStatusRequest) => axios.post('/Ticketing/TicketingVenue/UpdateVenueStatus', data),
  remove: (id: string) => axios.post('/Ticketing/TicketingVenue/DeleteVenue', { id }),
}
```

---

## 六、后端实现要点（供前端理解）

- `SaveVenue` 会将 floor/zone/seat 的临时 id 转为真实 uid，并修正关联关系。
- `seatTypes` 前端为数组，后端落库为逗号分隔字符串。
- `Stage` 若传入则 InsertOrUpdate；不传不会删除现有舞台。
- 任何失败都会返回 `successed=false`，并在 `msg` 给出错误原因。

---

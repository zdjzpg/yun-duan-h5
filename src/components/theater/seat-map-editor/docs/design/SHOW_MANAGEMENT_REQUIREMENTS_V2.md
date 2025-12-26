# 🎭 演出管理模块 - 功能需求文档 v2.0

**创建时间：** 2025-12-17  
**更新时间：** 2025-12-17（根据 PRD v1.1 重大调整）  
**状态：** ⏳ 待开发  
**优先级：** 🔴 高  
**预计工时：** 10-14 小时

---

## 🔄 版本更新说明

### **v2.0 重大调整（2025-12-17）**

根据最新 PRD v1.1（[Notion 链接](https://www.notion.so/gkf/SaaS-PRD-2cb090a10533802293bbca998944e341)）第 8 章**"座位结构锁定 & 场馆版本复制策略"**，对演出管理模块进行重大调整：

#### **核心变化：**
1. **演出级不是"快照座位数据"，而是"引用场馆级座位 + 映射票档"**
   - ❌ v1.0 设计：复制座位数据到演出级（独立存储）
   - ✅ v2.0 设计：通过 `show_seat_prices` 表引用场馆级座位

2. **座位结构锁定规则：**
   - 场馆一旦有演出产生订单，座位结构（排号/座号/座区）即被锁定
   - 不会出现"场馆调整，演出不同步"的场景
   - 如需调整结构，使用"复制场馆"创建新版本

3. **功能调整：**
   - ~~功能 1：座位图快照~~ → **改为"座位-票档映射创建"**
   - 功能 2：演出级座位状态管理 → 保持不变
   - 功能 3：锁座/解锁功能 → 保持不变
   - ~~功能 4：座位图版本对比~~ → **删除**（因为结构锁定后不会出现版本差异）

---

## 📋 目录

1. [模块概述](#模块概述)
2. [核心概念](#核心概念)
3. [功能清单](#功能清单)
4. [数据模型](#数据模型)
5. [详细需求](#详细需求)
6. [开发计划](#开发计划)
7. [验收标准](#验收标准)
8. [座位结构锁定功能](#座位结构锁定功能)

---

## 📌 模块概述

### **功能定位**
演出管理模块负责管理具体演出的座位-票档映射、座位状态、订单锁定等功能。

### **系统架构**

```
┌─────────────────────────────────────────────────┐
│           剧场 SaaS 系统架构（v2.0）              │
├─────────────────────────────────────────────────┤
│                                                 │
│  场馆管理层（Venue Layer）✅ 已完成               │
│  ┌──────────────────────────────┐               │
│  │  场馆基础信息                  │               │
│  │  - 楼层（floors）              │               │
│  │  - 座区（zones）               │               │
│  │  - 座位（seats）               │               │
│  │    ├─ x, y（坐标）            │               │
│  │    ├─ rowLabel, seatLabel    │               │
│  │    ├─ floorId, zoneId        │               │
│  │    └─ status（场馆级状态）     │               │
│  └──────────────────────────────┘               │
│         ↓ 引用（不复制）                          │
│                                                 │
│  演出管理层（Show Layer）⏳ 待开发                │
│  ┌──────────────────────────────┐               │
│  │  演出基础信息                  │               │
│  │  - 演出名称、时间              │               │
│  │  - 票档（price_tiers）        │               │
│  │                               │               │
│  │  座位-票档映射                 │  ← 功能 1     │
│  │  - show_seat_prices          │               │
│  │    (seat_id → price_tier_id) │               │
│  │                               │               │
│  │  演出级座位状态                │  ← 功能 2     │
│  │  - show_seat_status          │               │
│  │    (可售/锁定/已订/已售)       │               │
│  │                               │               │
│  │  锁座/解锁                     │  ← 功能 3     │
│  │  - 15分钟自动锁座              │               │
│  │  - 超时自动解锁                │               │
│  └──────────────────────────────┘               │
│         ↓ 订单关联                               │
│                                                 │
│  订单管理层（Order Layer）                        │
│  └─ 订单创建/支付/退款（外部系统）                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🧩 核心概念

### **1. 场馆级 vs 演出级（重新理解）**

| 维度 | 场馆级（Venue） | 演出级（Show） |
|------|----------------|---------------|
| **数据存储** | 座位物理属性（x, y, rowLabel, seatLabel, zoneId） | 座位-票档映射 + 座位状态 |
| **数据关系** | 座位数据的**唯一来源** | **引用**场馆级座位（通过 seat_id） |
| **座位状态** | 场馆级状态（available / unavailable） | 演出级状态（可售/锁定/已订/已售） |
| **修改权限** | 有订单后结构锁定 | 票档映射可调整 |
| **生命周期** | 长期（场馆存在期间） | 短期（演出结束后归档） |

**关键：演出级不复制座位数据，而是通过 `seat_id` 引用场馆级座位！**

---

### **2. 座位状态的两层管理**

#### **场馆级状态（Seat.status）**
- `available`：可用于演出售卖
- `unavailable`：禁售（设备位/视线遮挡/保留座等）

#### **演出级状态（ShowSeatStatus.status）**
- `available`：可售
- `locked`：锁定（15分钟）
- `booked`：已订
- `sold`：已售

**关系：**
```typescript
// 只有场馆级 status = 'available' 的座位，才会在演出级显示为"可售"
if (venueSeat.status === 'unavailable') {
  // 该座位在所有演出中都不可售
  return null;
}

// 演出级状态流转
available → locked → booked → sold
   ↑           ↓ 超时
   └───────────┘
```

---

### **3. 座位结构锁定规则**

根据 PRD 第 8 章，场馆的座位结构修改受以下规则限制：

| 阶段 | 触发条件 | 结构性修改 | 显示级调整 |
|------|---------|-----------|-----------|
| **A** | 未关联演出 | ✅ 允许 | ✅ 允许 |
| **B** | 已关联演出，但无订单 | ✅ 允许（需提示） | ✅ 允许 |
| **C** | **已有演出产生订单** | ❌ **禁止** | ✅ 允许 |

**结构性修改（阶段 C 禁止）：**
- ❌ 删除座位
- ❌ 修改排号/座号（rowLabel, seatLabel）
- ❌ 调整座区归属（zoneId）
- ❌ 删除座区/楼层

**显示级调整（阶段 C 允许）：**
- ✅ 移动座位位置（x, y）
- ✅ 修改座区名称、颜色
- ✅ 修改舞台形状

**解决方案：**
- 如需调整结构 → 复制场馆创建新版本
- 旧场馆保留用于历史订单

---

## 📝 功能清单

### **调整后的功能清单（3 个核心功能 + 1 个座位图编辑器增强）**

| # | 功能名称 | 描述 | 优先级 | 预计工时 | 状态 |
|---|---------|------|--------|---------|------|
| **1** | **座位-票档映射创建** | 创建演出时，为座位分配票档 | P0 | 3-4h | ⏳ 未开始 |
| **2** | **演出级座位状态管理** | 可售/锁定/已订/已售状态管理 | P0 | 3-4h | ⏳ 未开始 |
| **3** | **锁座/解锁功能** | 15分钟自动锁座 + 自动解锁 | P0 | 3-4h | ⏳ 未开始 |
| **4** | **座位结构锁定功能** | 场馆有订单后禁止结构性修改 | P0 | 1-2h | ⏳ 未开始 |

**总计：** 10-14 小时

**删除的功能：**
- ~~座位图快照~~（改为映射创建）
- ~~座位图版本对比~~（因为结构锁定后不会出现版本差异）

---

## 🗂️ 数据模型

### **1. 演出（Show）模型**

```typescript
/**
 * 演出数据模型
 */
export type Show = {
  /** 演出 ID */
  id: string;
  
  /** 场馆 ID */
  venueId: string;
  
  /** 演出名称 */
  name: string;
  
  /** 演出时间 */
  showTime: Date;
  
  /** 售卖模式（仅精确座位模式使用） */
  salesMode?: 'ZONE_TICKET' | 'SEAT_TICKET';
  
  /** 演出状态 */
  status: 'draft' | 'published' | 'ongoing' | 'finished' | 'cancelled';
  
  /** 创建时间 */
  createdAt: Date;
  
  /** 更新时间 */
  updatedAt: Date;
};
```

---

### **2. 票档（PriceTier）模型**

```typescript
/**
 * 票档数据模型
 */
export type PriceTier = {
  /** 票档 ID */
  id: string;
  
  /** 演出 ID */
  showId: string;
  
  /** 票档名称（VIP / A档 / B档 等） */
  name: string;
  
  /** 票面价格 */
  price: number;
  
  /** 颜色（用于座位图显示） */
  color: string;
  
  /** 备注 */
  remark?: string;
  
  /** 创建时间 */
  createdAt: Date;
};
```

---

### **3. 座位-票档映射（ShowSeatPrice）模型**

```typescript
/**
 * 座位-票档映射表（核心）
 * 
 * 作用：建立演出级座位与票档的关联关系
 * 特点：不复制座位数据，只记录映射关系
 */
export type ShowSeatPrice = {
  /** 映射 ID */
  id: string;
  
  /** 演出 ID */
  showId: string;
  
  /** 场馆级座位 ID（引用 venues.seats.id） */
  seatId: string;
  
  /** 票档 ID */
  priceTierId: string;
  
  /** 创建时间 */
  createdAt: Date;
};
```

**说明：**
- 这张表是演出级的核心
- `seatId` 引用场馆级的 `seats.id`，不复制座位数据
- 一个座位在一场演出中只能属于一个票档
- 一个票档可以包含多个座位

---

### **4. 演出级座位状态（ShowSeatStatus）模型**

```typescript
/**
 * 演出级座位状态枚举
 */
export type ShowSeatStatusType = 
  | 'available'   // 可售
  | 'locked'      // 锁定（15分钟）
  | 'booked'      // 已订
  | 'sold';       // 已售

/**
 * 演出级座位状态表
 * 
 * 作用：记录座位在演出中的售卖状态
 */
export type ShowSeatStatus = {
  /** 状态记录 ID */
  id: string;
  
  /** 演出 ID */
  showId: string;
  
  /** 场馆级座位 ID（引用 venues.seats.id） */
  seatId: string;
  
  /** 座位状态 */
  status: ShowSeatStatusType;
  
  /** 锁定信息（仅当 status = 'locked' 时有效） */
  lockInfo?: {
    /** 锁定用户 ID */
    userId: string;
    
    /** 锁定时间 */
    lockedAt: Date;
    
    /** 过期时间 */
    expiresAt: Date;
  };
  
  /** 订单 ID（仅当 status = 'booked' 或 'sold' 时有效） */
  orderId?: string;
  
  /** 更新时间 */
  updatedAt: Date;
};
```

---

### **5. 座位锁定记录（SeatLock）模型**

```typescript
/**
 * 座位锁定记录（用于审计和调试）
 */
export type SeatLock = {
  /** 记录 ID */
  id: string;
  
  /** 演出 ID */
  showId: string;
  
  /** 座位 ID */
  seatId: string;
  
  /** 用户 ID */
  userId: string;
  
  /** 锁定时间 */
  lockedAt: Date;
  
  /** 过期时间 */
  expiresAt: Date;
  
  /** 锁定结果 */
  result: 'success' | 'expired' | 'cancelled' | 'converted_to_order';
  
  /** 订单 ID（如果转换为订单） */
  orderId?: string;
  
  /** 解锁时间 */
  unlockedAt?: Date;
  
  /** 解锁原因 */
  unlockReason?: 'timeout' | 'user_cancel' | 'payment_success';
};
```

---

## 📐 详细需求

---

## 功能 1：座位-票档映射创建

### **需求描述**
创建演出时，为场馆的座位分配票档，建立映射关系。

---

### **核心逻辑**

#### **1. 演出创建流程**

```
创建演出
   ↓
选择场馆（获取场馆的所有可售座位）
   ↓
配置票档（VIP / A档 / B档 等）
   ↓
为座位分配票档
   ↓
生成 show_seat_prices 映射表
```

#### **2. 座位-票档分配方式**

**方式 A：按座区批量分配（推荐）**
1. 选择票档（如 "A档 ¥680"）
2. 在座位图上点击座区（如 "正厅A区"）
3. 系统将该座区的所有座位分配给该票档

**方式 B：框选座位分配**
1. 选择票档
2. 在座位图上框选部分座位
3. 系统将选中的座位分配给该票档

**方式 C：单个座位分配**
1. 选择票档
2. 点击单个座位
3. 该座位分配给该票档

---

### **UI 交互**

#### **界面：演出配置 - 票档与价格**

```
┌─────────────────────────────────────────────────┐
│  创建演出 - 步骤 3/4：票档与价格                  │
├─────────────────────────────────────────────────┤
│  场馆：北京音乐厅（1200座）                       │
│                                                 │
│  票档配置：                                      │
│  ┌───────────────────────────────┐              │
│  │ 🔴 VIP档 ¥980  [编辑] [删除]  │              │
│  │    已分配：200座               │              │
│  │                               │              │
│  │ 🟢 A档   ¥680  [编辑] [删除]  │  ← 当前选中   │
│  │    已分配：600座               │              │
│  │                               │              │
│  │ 🟡 B档   ¥480  [编辑] [删除]  │              │
│  │    已分配：400座               │              │
│  │                               │              │
│  │ [+ 新增票档]                   │              │
│  └───────────────────────────────┘              │
│                                                 │
│  座位图（楼层：1楼大厅 ▼）                        │
│  ┌─────────────────────────────────┐            │
│  │       🎭 舞台                    │            │
│  │                                 │            │
│  │   🔴🔴🔴  🟢🟢🟢🟢  🟡🟡🟡       │            │
│  │   🔴🔴🔴  🟢🟢🟢🟢  🟡🟡🟡       │            │
│  │   🔴🔴🔴  🟢🟢🟢🟢  🟡🟡🟡       │            │
│  │                                 │            │
│  │   🔴 VIP档  🟢 A档  🟡 B档      │            │
│  │   ⚪ 未分配                      │            │
│  └─────────────────────────────────┘            │
│                                                 │
│  操作提示：                                      │
│  1. 选择左侧票档                                 │
│  2. 在座位图上点击座区或框选座位                  │
│  3. 选中的座位将分配给该票档                      │
│                                                 │
│  统计：已分配 1200/1200 座                       │
│                                                 │
│  ┌─────────────┐  ┌─────────────┐              │
│  │   上一步     │  │   下一步     │              │
│  └────────���────┘  └─────────────┘              │
└─────────────────────────────────────────────────┘
```

---

### **API 设计**

#### **1. 创建票档**

```typescript
POST /api/shows/{showId}/price-tiers

Request Body:
{
  "name": "A档",
  "price": 680,
  "color": "#52c41a",
  "remark": "中间区域最佳位置"
}

Response:
{
  "success": true,
  "data": {
    "id": "tier-1",
    "showId": "show-1",
    "name": "A档",
    "price": 680,
    "color": "#52c41a"
  }
}
```

#### **2. 批量分配座位到票档**

```typescript
POST /api/shows/{showId}/seat-price-mapping

Request Body:
{
  "priceTierId": "tier-1",
  "seatIds": ["seat-1", "seat-2", "seat-3", ...]
}

Response:
{
  "success": true,
  "data": {
    "created": 600,  // 成功创建 600 条映射
    "priceTierId": "tier-1",
    "showId": "show-1"
  }
}
```

#### **3. 按座区分配**

```typescript
POST /api/shows/{showId}/seat-price-mapping/by-zone

Request Body:
{
  "priceTierId": "tier-1",
  "zoneId": "zone-a"
}

Response:
{
  "success": true,
  "data": {
    "created": 600,
    "zoneId": "zone-a",
    "zoneName": "正厅A区"
  }
}
```

---

### **开发任务**

- [ ] **后端 API**
  - [ ] `POST /api/shows/{showId}/price-tiers` - 创建票档
  - [ ] `PUT /api/shows/{showId}/price-tiers/{id}` - 编辑票档
  - [ ] `DELETE /api/shows/{showId}/price-tiers/{id}` - 删除票档
  - [ ] `POST /api/shows/{showId}/seat-price-mapping` - 批量分配座位
  - [ ] `POST /api/shows/{showId}/seat-price-mapping/by-zone` - 按座区分配
  - [ ] `GET /api/shows/{showId}/seat-price-mapping` - 查询映射关系

- [ ] **前端组件**
  - [ ] `PriceTierPanel.tsx` - 票档配置面板
  - [ ] `SeatPriceMappingEditor.tsx` - 座位-票档分配编辑器
  - [ ] `PriceTierList.tsx` - 票档列表组件

- [ ] **工具函数**
  - [ ] `assignSeatsToTier()` - 分配座位到票档
  - [ ] `getSeatsByZone()` - 获取座区的所有座位
  - [ ] `calculateTierStats()` - 计算票档统计

**预计工时：** 3-4 小时

---

## 功能 2：演出级座位状态管理

### **需求描述**
管理演出级座位的状态（可售/锁定/已订/已售），支持状态查询、更新、统计。

---

### **状态流转图**

```
                 ┌─────────────┐
                 │  可售         │
                 │ (available)  │
                 └──────┬───────┘
                        │ 用户点击座位
                        ↓
                 ┌─────────────┐
           ┌────→│  锁定         │────┐
           │     │ (locked)     │    │
           │     │ ⏱️ 15分钟     │    │
           │     └──────┬───────┘    │
           │            │            │
      超时/取消      完成支付      管理员解锁
           │            ↓            │
           │     ┌─────────────┐    │
           │     │  已订         │    │
           │     │ (booked)     │    │
           │     └──────┬───────┘    │
           │            │            │
           │        取票/核销         │
           │            ↓            │
           │     ┌─────────────┐    │
           └────→│  已售         │←───┘
                 │ (sold)       │
                 └──────────────┘
```

---

### **核心功能**

#### **1. 状态查询**

```typescript
GET /api/shows/{showId}/seat-status

Response:
{
  "total": 1200,
  "available": 800,
  "locked": 50,
  "booked": 200,
  "sold": 150,
  "seats": [
    {
      "seatId": "seat-1",
      "status": "available",
      // 座位物理属性（从场馆级查询）
      "rowLabel": "1",
      "seatLabel": "1",
      "zoneName": "正厅A区",
      "x": 100,
      "y": 200,
      // 演出级属性
      "priceTierName": "A档",
      "price": 680
    },
    // ...
  ]
}
```

#### **2. 状态更新**

```typescript
PATCH /api/shows/{showId}/seat-status/{seatId}

Request Body:
{
  "status": "locked",
  "lockInfo": {
    "userId": "user-123",
    "expiresAt": "2025-12-17T10:15:00Z"
  }
}
```

---

### **UI 交互**

#### **B 端演出座位图管理界面**

```
┌─────────────────────────────────────────────────┐
│  演出座位图 - 2025新年音乐会                      │
├─────────────────────────────────────────────────┤
│  [1楼大厅 ▼] [刷新] [导出] [批量操作 ▼]           │
│                                                 │
│  统计信息：                                      │
│  ┌─────┬─────┬─────┬─────┐                      │
│  │可售  │锁定  │已订  │已售  │                      │
│  │ 800 │ 50  │ 200 │ 150 │                      │
│  │ 67% │ 4%  │ 17% │ 13% │                      │
│  └─────┴─────┴─────┴─────┘                      │
│                                                 │
│  座位图：                                        │
│  ┌───────────────────────────────┐              │
│  │       🎭 舞台                  │              │
│  │                               │              │
│  │   🔵🔵🔵 🟠🟠 🟢🟢🟢🟢          │              │
│  │   🔵🔵🔵 🟠🟠 🟢🟢🟢🟢          │              │
│  │   🔵🔵🔵 🔵🔵 ⚫⚫⚫⚫          │              │
│  │                               │              │
│  │   🔵 可售 (800)                │              │
│  │   🟠 锁定 (50)  ⏱️ 倒计时      │              │
│  │   🟢 已订 (200)                │              │
│  │   ⚫ 已售 (150)                │              │
│  └───────────────────────────────┘              │
│                                                 │
│  最近操作：                                      │
│  10:05 - 用户 user-123 锁定座位 1排1座           │
│  10:03 - 订单 order-456 完成支付（2排3-5座）     │
└─────────────────────────────────────────────────┘
```

---

### **开发任务**

- [ ] **后端 API**
  - [ ] `GET /api/shows/{showId}/seat-status` - 查询座位状态
  - [ ] `PATCH /api/shows/{showId}/seat-status/{seatId}` - 更新状态
  - [ ] `GET /api/shows/{showId}/seat-status/stats` - 统计信息

- [ ] **前端组件**
  - [ ] `ShowSeatMapViewer.tsx` - 演出座位图查看器
  - [ ] `SeatStatusPanel.tsx` - 座位状态面板
  - [ ] `SeatStatsCard.tsx` - 座位统计卡片

- [ ] **工具函数**
  - [ ] `getSeatStatusColor()` - 获取状态颜色
  - [ ] `mergeSeatWithVenueData()` - 合并场馆级和演出级数据
  - [ ] `calculateSeatStats()` - 座位统计

**预计工时：** 3-4 小时

---

## 功能 3：锁座/解锁功能

### **需求描述**
用户选座后自动锁定 15 分钟，超时未支付自动解锁；支持管理员强制解锁。

---

### **核心逻辑**

#### **1. 自动锁座**

```typescript
async function lockSeat(showId: string, seatId: string, userId: string) {
  // 1. 检查座位当前状态
  const seatStatus = await getSeatStatus(showId, seatId);
  
  if (seatStatus.status !== 'available') {
    throw new Error('座位不可选');
  }
  
  // 2. 计算过期时间（15分钟后）
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
  
  // 3. 更新座位状态为"锁定"
  await updateSeatStatus(showId, seatId, {
    status: 'locked',
    lockInfo: {
      userId,
      lockedAt: now,
      expiresAt,
    },
  });
  
  // 4. 创建锁定记录
  await createSeatLock({
    showId,
    seatId,
    userId,
    lockedAt: now,
    expiresAt,
  });
}
```

#### **2. 自动解锁（定时任务）**

```typescript
// 每分钟执行一次
async function autoUnlockExpiredSeats() {
  const now = new Date();
  
  // 查询所有过期的锁定座位
  const expiredSeats = await db.query(`
    SELECT * FROM show_seat_status
    WHERE status = 'locked'
    AND lock_expires_at < $1
  `, [now]);
  
  // 批量解锁
  for (const seat of expiredSeats) {
    await unlockSeat(seat.showId, seat.seatId, 'timeout');
  }
}
```

---

### **开发任务**

- [ ] **后端 API**
  - [ ] `POST /api/shows/{showId}/seats/{seatId}/lock` - 锁定座位
  - [ ] `POST /api/shows/{showId}/seats/{seatId}/unlock` - 解锁座位
  - [ ] `POST /api/shows/{showId}/seats/batch-lock` - 批量锁定

- [ ] **定时任务**
  - [ ] `autoUnlockExpiredSeats()` - 自动解锁定时任务（Cron）

- [ ] **前端组件**
  - [ ] `SeatLockTimer.tsx` - 锁定倒计时组件
  - [ ] `UnlockConfirmModal.tsx` - 解锁确认弹窗

**预计工时：** 3-4 小时

---

## 功能 4：座位结构锁定功能

### **需求描述**
根据 PRD 第 8 章，场馆一旦有演出产生订单，座位结构即被锁定，禁止结构性修改。

---

### **核心逻辑**

#### **1. 检查场馆是否有订单**

```typescript
// 后端 API
GET /api/venues/{venueId}/lock-status

Response:
{
  "locked": true,  // 是否锁定
  "reason": "该场馆下的演出已产生 50 个订单",
  "orderCount": 50,
  "affectedShows": [
    {
      "showId": "show-1",
      "showName": "2025新年音乐会",
      "orderCount": 30
    },
    {
      "showId": "show-2",
      "showName": "圣诞音乐会",
      "orderCount": 20
    }
  ]
}
```

#### **2. 座位图编辑器中的权限控制**

```typescript
// 在座位图编辑器中
const { locked, reason } = await checkVenueLockStatus(venueId);

if (locked) {
  // 禁用结构性修改按钮
  disableButton('deleteSeat');
  disableButton('modifyRowLabel');
  disableButton('modifySeatLabel');
  disableButton('changeZone');
  
  // 显示锁定提示
  showTooltip('该场馆已有演出产生订单，座位结构已锁定');
}
```

#### **3. 复制场馆功能**

```typescript
POST /api/venues/{venueId}/copy

Response:
{
  "success": true,
  "data": {
    "newVenueId": "venue-2",
    "newVenueName": "北京音乐厅（v2）",
    "copiedSeats": 1200,
    "copiedZones": 5,
    "copiedFloors": 2
  }
}
```

---

### **UI 交互**

#### **1. 座位图编辑器 - 锁定状态**

```
┌─────────────────────────────────────────────────┐
│  座位图编辑器 - 北京音乐厅                        │
├─────────────────────────────────────────────────┤
│  ⚠️ 该场馆已有演出产生订单，座位结构已锁定         │
│                                                 │
│  允许的操作：                                    │
│  ✅ 移动座位位置（x, y）                         │
│  ✅ 修改座区名称、颜色                           │
│  ✅ 修改舞台形状                                 │
│                                                 │
│  禁止的操作：                                    │
│  ❌ 删除座位                                    │
│  ❌ 修改排号/座号                               │
│  ❌ 调整座区归属                                 │
│                                                 │
│  如需调整座位结构，请 [复制场馆] 创建新版本       │
└─────────────────────────────────────────────────┘
```

#### **2. 删除座位按钮 - 禁用状态**

```
[删除座位]  ← 按钮置灰，鼠标悬停显示：
            "该场馆已有订单，无法删除座位。
             如需调整，请复制场馆创建新版本。"
```

---

### **开发任务**

- [ ] **后端 API**
  - [ ] `GET /api/venues/{venueId}/lock-status` - 检查锁定状态
  - [ ] `POST /api/venues/{venueId}/copy` - 复制场馆

- [ ] **前端组件**
  - [ ] `VenueLockWarning.tsx` - 锁定警告提示
  - [ ] `CopyVenueModal.tsx` - 复制场馆弹窗

- [ ] **座位图编辑器增强**
  - [ ] 在编辑器初始化时检查锁定状态
  - [ ] 根据锁定状态禁用对应按钮
  - [ ] 添加提示文案

**预计工时：** 1-2 小时

---

## 📅 开发计划（2 周）

### **Week 1：核心功能**

**Day 1-2：座位-票档映射（3-4h）**
- [ ] Day 1 上午：数据模型设计
  - [ ] 设计 `show_seat_prices` 表
  - [ ] 设计 `price_tiers` 表
- [ ] Day 1 下午：后端 API
  - [ ] 票档 CRUD 接口
  - [ ] 座位-票档映射接口
- [ ] Day 2 上午：前端组件
  - [ ] 票档配置面板
  - [ ] 座位分配编辑器
- [ ] Day 2 下午：联调测试

**Day 3-4：座位状态管理（3-4h）**
- [ ] Day 3 上午：状态管理 API
  - [ ] 查询状态接口
  - [ ] 更新状态接口
- [ ] Day 3 下午：前端组件
  - [ ] 演出座位图查看器
  - [ ] 状态面板
- [ ] Day 4：测试优化

---

### **Week 2：锁座和结构锁定**

**Day 1-2：锁座/解锁（3-4h）**
- [ ] Day 1 上午：锁座 API + 定时任务
- [ ] Day 1 下午：前端组件（倒计时）
- [ ] Day 2：功能测试 + 压力测试

**Day 3：座位结构锁定（1-2h）**
- [ ] 上午：锁定检查 API + 复制场馆
- [ ] 下午：座位图编辑器权限控制

---

## ✅ 验收标准

### **功能 1：座位-票档映射**
- [ ] 创建演出时可以配置票档
- [ ] 可以按座区批量分配座位
- [ ] 可以框选座位分配
- [ ] 映射关系正确存储
- [ ] 座位图正确显示票档颜色

### **功能 2：座位状态管理**
- [ ] 座位状态正确显示（4 种状态）
- [ ] 状态统计准确
- [ ] B 端管理界面清晰

### **功能 3：锁座/解锁**
- [ ] 用户点击座位自动锁定
- [ ] 倒计时正确显示
- [ ] 15 分钟后自动解锁
- [ ] 支付成功后转为"已订"

### **功能 4：座位结构锁定**
- [ ] 有订单后正确禁用结构性修改按钮
- [ ] 锁定提示清晰
- [ ] 复制场馆功能正常

---

## 📊 数据库设计

### **表 1：shows（演出表）**

```sql
CREATE TABLE shows (
  id VARCHAR(50) PRIMARY KEY,
  venue_id VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  show_time TIMESTAMP NOT NULL,
  sales_mode VARCHAR(20),  -- 'ZONE_TICKET' / 'SEAT_TICKET'
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_venue_id (venue_id),
  INDEX idx_show_time (show_time),
  INDEX idx_status (status)
);
```

### **表 2：show_price_tiers（票档表）**

```sql
CREATE TABLE show_price_tiers (
  id VARCHAR(50) PRIMARY KEY,
  show_id VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  color VARCHAR(20),
  remark TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_show_id (show_id),
  FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE
);
```

### **表 3：show_seat_prices（座位-票档映射表）**

```sql
CREATE TABLE show_seat_prices (
  id VARCHAR(50) PRIMARY KEY,
  show_id VARCHAR(50) NOT NULL,
  seat_id VARCHAR(50) NOT NULL,  -- 引用 venues.seats.id
  price_tier_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_show_id (show_id),
  INDEX idx_seat_id (seat_id),
  INDEX idx_price_tier_id (price_tier_id),
  
  UNIQUE KEY unique_show_seat (show_id, seat_id),  -- 一个座位在一场演出中只能属于一个票档
  
  FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
  FOREIGN KEY (price_tier_id) REFERENCES show_price_tiers(id) ON DELETE CASCADE
);
```

### **表 4：show_seat_status（演出级座位状态表）**

```sql
CREATE TABLE show_seat_status (
  id VARCHAR(50) PRIMARY KEY,
  show_id VARCHAR(50) NOT NULL,
  seat_id VARCHAR(50) NOT NULL,  -- 引用 venues.seats.id
  status VARCHAR(20) NOT NULL DEFAULT 'available',  -- 'available' / 'locked' / 'booked' / 'sold'
  
  -- 锁定信息
  lock_user_id VARCHAR(50),
  lock_started_at TIMESTAMP,
  lock_expires_at TIMESTAMP,
  
  -- 订单信息
  order_id VARCHAR(50),
  
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_show_id (show_id),
  INDEX idx_seat_id (seat_id),
  INDEX idx_status (status),
  INDEX idx_lock_expires (lock_expires_at),
  
  UNIQUE KEY unique_show_seat_status (show_id, seat_id),
  
  FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE
);
```

### **表 5：seat_locks（座位锁定记录表）**

```sql
CREATE TABLE seat_locks (
  id VARCHAR(50) PRIMARY KEY,
  show_id VARCHAR(50) NOT NULL,
  seat_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  locked_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  result VARCHAR(30),  -- 'success' / 'expired' / 'cancelled' / 'converted_to_order'
  order_id VARCHAR(50),
  unlocked_at TIMESTAMP,
  unlock_reason VARCHAR(30),  -- 'timeout' / 'user_cancel' / 'payment_success'
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_show_id (show_id),
  INDEX idx_seat_id (seat_id),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

---

## 📚 参考资料

### **PRD 文档**
- [景区 SaaS · 剧场业务 · 精确座位模式 & 座位图迭代 PRD v1.1](https://www.notion.so/gkf/SaaS-PRD-2cb090a10533802293bbca998944e341)
- 重点章节：
  - 第 4 章：精确座位模式 - 演出层售卖模式与票档关系
  - 第 8 章：座位结构锁定 & 场馆版本复制策略

### **行业案例**
- **猫眼电影：** 座位锁定 10 分钟
- **大麦网：** 座位锁定 15 分钟
- **淘票票：** 座位锁定 15 分钟

---

**文档创建时间：** 2025-12-17  
**文档状态：** ✅ 待确认  
**下一步：** 等待用户确认后开始开发

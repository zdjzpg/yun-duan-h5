# 🎭 演出管理模块 - 功能需求文档

**创建时间：** 2025-12-17  
**状态：** ⏳ 待开发  
**优先级：** 🔴 高（第三优先级）  
**预计工时：** 12-16 小时

---

## 📋 目录

1. [模块概述](#模块概述)
2. [业务背景](#业务背景)
3. [核心概念](#核心概念)
4. [功能清单](#功能清单)
5. [数据模型](#数据模型)
6. [详细需求](#详细需求)
7. [开发计划](#开发计划)
8. [验收标准](#验收标准)

---

## 📌 模块概述

### **功能定位**
演出管理模块是剧场 SaaS 系统的核心业务模块，负责管理具体演出的座位状态、订单锁定、版本对比等功能。

### **与座位图编辑器的关系**

```
┌─────────────────────────────────────────────────┐
│           剧场 SaaS 系统架构                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  场馆管理层（Venue Layer）                        │
│  ┌──────────────────────────────┐               │
│  │  座位图编辑器（已完成 100%）    │               │
│  │  - 楼层管理                    │               │
│  │  - 座位创建/编辑               │               │
│  │  - 座区管理                    │               │
│  │  - 舞台设置                    │               │
│  │  - 背景图                      │               │
│  │  - 导出功能                    │               │
│  └──────────────────────────────┘               │
│         ↓ 复制（快照）                            │
│                                                 │
│  演出管理层（Show Layer）⏳ 本模块                │
│  ┌──────────────────────────────┐               │
│  │  演出级座位状态管理            │               │
│  │  - 座位图快照                  │  ← 功能 1     │
│  │  - 座位状态管理                │  ← 功能 2     │
│  │  - 锁座/解锁                   │  ← 功能 3     │
│  │  - 版本对比                    │  ← 功能 4     │
│  └──────────────────────────────┘               │
│         ↓ 订单关联                               │
│                                                 │
│  订单管理层（Order Layer）                        │
│  ┌──────────────────────────────┐               │
│  │  订单创建/支付/退款             │               │
│  │  - 选座下单                    │               │
│  │  - 支付回调                    │               │
│  │  - 订单状态                    │               │
│  └──────────────────────────────┘               │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🎯 业务背景

### **业务场景**

#### **场景 1：创建演出**
1. 运营人员在场馆管理后台创建了座位图（场馆级）
2. 演出经理创建新演出（如"2025年新年音乐会"）
3. 系统需要将场馆级座位图**复制**到演出级
4. 演出级座位图继承场馆布局，但状态独立管理

#### **场景 2：座位销售**
1. 用户在 C 端选座购票
2. 点击座位后，座位状态变为"锁定"（15分钟倒计时）
3. 用户完成支付，座位状态变为"已售"
4. 如果超时未支付，自动解锁，座位变回"可售"

#### **场景 3：场馆调整**
1. 场馆管理员修改了场馆级座位图（如增加座位）
2. 演出经理需要对比"场馆级"和"演出级"的差异
3. 决定是否同步更新到演出级

---

## 🧩 核心概念

### **1. 场馆级（Venue Level）vs 演出级（Show Level）**

| 维度 | 场馆级（Venue） | 演出级（Show） |
|------|----------------|---------------|
| **作用范围** | 整个剧场的物理布局 | 单场演出的座位销售 |
| **数据生命周期** | 长期（场馆存在期间） | 短期（演出结束后归档） |
| **座位状态** | `available` / `unavailable` | `可售` / `锁定` / `已订` / `已售` |
| **修改权限** | 场馆管理员 | 演出经理 + 系统自动 |
| **创建方式** | 手动编辑（座位图编辑器） | 从场馆级复制快照 |
| **是否可修改** | 随时可修改 | 创建后一般不修改布局 |

### **2. 座位状态流转**

#### **场馆级状态（简单）**
```
available ←→ unavailable
   ↑            ↑
  可售        不可售
```

#### **演出级状态（复杂）**
```
可售（available）
   ↓ 用户点击座位
锁定（locked）⏱️ 15分钟倒计时
   ↓ 完成支付      ↓ 超时/取消
已订（booked）    → 可售（available）
   ↓ 取票/核销
已售（sold）
```

### **3. 座位图快照（Snapshot）**

**定义：** 从场馆级复制到演出级的座位图数据

**快照内容：**
- ✅ 座位坐标（x, y）
- ✅ 座位编号（rowLabel, seatLabel）
- ✅ 座区归属（zoneId, zoneName）
- ✅ 楼层归属（floorId）
- ❌ **不包含状态**（演出级状态独立管理）

**快照时机：**
- 创建演出时自动生成
- 场馆调整后可选择性重新快照

---

## 📝 功能清单

### **阶段 8：演出级功能（4 个功能）**

| # | 功能名称 | 优先级 | 预计工时 | 状态 |
|---|---------|--------|---------|------|
| 1 | 座位图快照 | P0 | 3-4h | ⏳ 未开始 |
| 2 | 演出级座位状态管理 | P0 | 4-5h | ⏳ 未开始 |
| 3 | 锁座/解锁功能 | P0 | 3-4h | ⏳ 未开始 |
| 4 | 座位图版本对比 | P1 | 2-3h | ⏳ 未开始 |

**总计：** 12-16 小时

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
  
  /** 演出状态 */
  status: 'draft' | 'published' | 'ongoing' | 'finished' | 'cancelled';
  
  /** 座位图快照版本号 */
  seatMapVersion: string;
  
  /** 座位图快照时间 */
  seatMapSnapshotTime: Date;
  
  /** 场馆级座位图版本（用于对比） */
  venueSeatsVersion?: string;
  
  /** 创建时间 */
  createdAt: Date;
  
  /** 更新时间 */
  updatedAt: Date;
};
```

---

### **2. 演出级座位（ShowSeat）模型**

```typescript
/**
 * 演出级座位状态枚举
 */
export type ShowSeatStatus = 
  | 'available'   // 可售
  | 'locked'      // 锁定（15分钟）
  | 'booked'      // 已订
  | 'sold';       // 已售

/**
 * 演出级座位数据
 */
export type ShowSeat = {
  /** 座位 ID */
  id: string;
  
  /** 演出 ID */
  showId: string;
  
  /** 场馆级座位 ID（用于关联） */
  venueSeatId: string;
  
  /** 楼层 ID */
  floorId: string;
  
  /** 座区 ID */
  zoneId?: string;
  
  /** 座区名称 */
  zoneName?: string;
  
  /** 排号 */
  rowLabel: string;
  
  /** 座号 */
  seatLabel: string;
  
  /** 座位坐标 */
  x: number;
  y: number;
  
  /** 座位状态 */
  status: ShowSeatStatus;
  
  /** 锁定信息（仅当 status = 'locked' 时有效） */
  lockInfo?: {
    /** 锁定用户 ID */
    userId: string;
    
    /** 锁定时间 */
    lockedAt: Date;
    
    /** 过期时间 */
    expiresAt: Date;
    
    /** 订单 ID（临时） */
    orderId?: string;
  };
  
  /** 订单 ID（仅当 status = 'booked' 或 'sold' 时有效） */
  orderId?: string;
  
  /** 座位类型（从场馆级继承） */
  type?: 'standard' | 'vip' | 'couple' | 'wheelchair';
  
  /** 标签（从场馆级继承） */
  tags?: string[];
  
  /** 创建时间（快照时间） */
  createdAt: Date;
  
  /** 更新时间 */
  updatedAt: Date;
};
```

---

### **3. 座位锁定记录（SeatLock）模型**

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

## 功能 1：座位图快照

### **需求描述**
创建演出时，从场馆级座位图复制一份快照到演出级，作为该场演出的座位布局基础。

---

### **功能流程**

```
┌──────────────┐
│ 1. 创建演出   │
└──────┬───────┘
       ↓
┌──────────────────────┐
│ 2. 选择场馆           │
│   - 从场馆列表选择     │
│   - 获取场馆座位图     │
└──────┬───────────────┘
       ↓
┌──────────────────────┐
│ 3. 生成快照           │
│   - 复制所有座位数据   │
│   - 生成演出级座位 ID  │
│   - 初始状态=可售      │
│   - 记录快照版本号     │
└──────┬───────────────┘
       ↓
┌──────────────────────┐
│ 4. 保存到数据库        │
│   - show 表           │
│   - show_seats 表     │
└──────────────────────┘
```

---

### **核心逻辑**

#### **1. 数据复制规则**

| 场馆级字段 | 演出级字段 | 复制规则 |
|-----------|-----------|---------|
| `id` | `venueSeatId` | 保留场馆座位 ID，用于关联 |
| `floorId` | `floorId` | ✅ 直接复制 |
| `zoneId` | `zoneId` | ✅ 直接复制 |
| `zoneName` | `zoneName` | ✅ 直接复制 |
| `rowLabel` | `rowLabel` | ✅ 直接复制 |
| `seatLabel` | `seatLabel` | ✅ 直接复制 |
| `x` | `x` | ✅ 直接复制 |
| `y` | `y` | ✅ 直接复制 |
| `type` | `type` | ✅ 直接复制 |
| `tags` | `tags` | ✅ 直接复制 |
| `status` | `status` | ❌ **不复制**，默认 `'available'` |
| - | `showId` | ✅ 新增，关联演出 ID |
| - | `id` | ✅ 新增，生成演出级座位 ID |

#### **2. 快照版本号生成**

```typescript
// 生成快照版本号（基于时间戳）
const snapshotVersion = `v${Date.now()}`;

// 或使用语义化版本号
const snapshotVersion = `v1.0.${Date.now()}`;
```

---

### **API 设计**

#### **请求：创建座位图快照**

```typescript
POST /api/shows/{showId}/seat-map-snapshot

Request Body:
{
  "venueId": "venue-123",
  "floorIds": ["floor-1", "floor-2"], // 可选，不传则复制所有楼层
}

Response:
{
  "success": true,
  "data": {
    "snapshotVersion": "v1702819200000",
    "totalSeats": 1200,
    "snapshotTime": "2025-12-17T10:00:00Z",
    "floors": [
      {
        "floorId": "floor-1",
        "floorName": "1楼大厅",
        "seatCount": 800
      },
      {
        "floorId": "floor-2",
        "floorName": "2楼包厢",
        "seatCount": 400
      }
    ]
  }
}
```

---

### **UI 交互**

#### **界面位置**
演出管理 → 创建演出 → 座位图设置

#### **界面设计**

```
┌─────────────────────────────────────────────┐
│  创建演出 - 步骤 3/4：座位图设置              │
├─────────────────────────────────────────────┤
│                                             │
│  场馆选择：                                  │
│  ┌─────────────────────────────┐            │
│  │ [下拉] 北京音乐厅 ▼          │            │
│  └─────────────────────────────┘            │
│                                             │
│  座位图预览：                                │
│  ┌─────────────────────────────┐            │
│  │                             │            │
│  │   [座位图 Canvas 缩略图]     │            │
│  │                             │            │
│  │   总座位数: 1200            │            │
│  │   可用座位: 1150            │            │
│  └─────────────────────────────┘            │
│                                             │
│  楼层选择：                                  │
│  ☑ 1楼大厅 (800座)                          │
│  ☑ 2楼包厢 (400座)                          │
│                                             │
│  ⚠️ 提示：创建快照后，演出座位布局将独立管理， │
│     与场馆座位图解耦。                        │
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │   上一步     │  │  创建快照    │          │
│  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────┘
```

---

### **开发任务**

- [ ] **后端 API**
  - [ ] `POST /api/shows/{showId}/seat-map-snapshot` - 创建快照
  - [ ] `GET /api/shows/{showId}/seat-map` - 获取演出座位图
  - [ ] 数据库表设计（`show_seats`）

- [ ] **前端组件**
  - [ ] `CreateShowWizard.tsx` - 创建演出向导
  - [ ] `SeatMapSnapshotPanel.tsx` - 快照设置面板
  - [ ] `SeatMapPreview.tsx` - 座位图预览组件

- [ ] **工具函数**
  - [ ] `createSeatMapSnapshot()` - 快照创建逻辑
  - [ ] `copySeatData()` - 座位数据复制
  - [ ] `generateSnapshotVersion()` - 版本号生成

**预计工时：** 3-4 小时

---

## 功能 2：演出级座位状态管理

### **需求描述**
管理演出级座位的状态（可售/锁定/已订/已售），支持状态流转、批量操作、统计分析。

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
                 
           管理员操作：批量设置为"可售"（清空订单信息）
```

---

### **状态定义**

| 状态 | 英文名 | 描述 | 颜色 | 可操作 |
|------|-------|------|------|-------|
| 可售 | `available` | 座位可以被用户选择 | 蓝色 `#1890ff` | C端：可选<br>B端：可编辑 |
| 锁定 | `locked` | 用户已选择，等待支付（15分钟） | 橙色 `#fa8c16` | C端：不可选（他人）<br>B端：可强制解锁 |
| 已订 | `booked` | 订单已创建，等待取票 | 绿色 `#52c41a` | C端：不可选<br>B端：可查看订单 |
| 已售 | `sold` | 已取票/已核销 | 灰色 `#8c8c8c` | C端：不可选<br>B端：可查看订单 |

---

### **核心功能**

#### **1. 状态查询**

```typescript
// 获取演出的所有座位状态
GET /api/shows/{showId}/seats?status=available

Response:
{
  "total": 1200,
  "available": 800,
  "locked": 50,
  "booked": 200,
  "sold": 150,
  "seats": [
    {
      "id": "seat-1",
      "rowLabel": "1",
      "seatLabel": "1",
      "status": "available",
      "x": 100,
      "y": 200
    },
    // ...
  ]
}
```

#### **2. 状态更新（单座位）**

```typescript
// 更新单个座位状态
PATCH /api/shows/{showId}/seats/{seatId}

Request Body:
{
  "status": "locked",
  "lockInfo": {
    "userId": "user-123",
    "expiresAt": "2025-12-17T10:15:00Z"
  }
}

Response:
{
  "success": true,
  "data": {
    "id": "seat-1",
    "status": "locked",
    "lockInfo": {
      "userId": "user-123",
      "lockedAt": "2025-12-17T10:00:00Z",
      "expiresAt": "2025-12-17T10:15:00Z"
    }
  }
}
```

#### **3. 批量状态更新**

```typescript
// 批量更新座位状态（管理员功能）
PATCH /api/shows/{showId}/seats/batch

Request Body:
{
  "seatIds": ["seat-1", "seat-2", "seat-3"],
  "status": "available",
  "clearLockInfo": true
}

Response:
{
  "success": true,
  "updated": 3
}
```

---

### **UI 交互**

#### **1. B 端管理界面**

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
│  └─────┴─────┴─────┴─────┘                      │
│                                                 │
│  座位图：                                        │
│  ┌───────────────────────────────┐              │
│  │                               │              │
│  │   🔵🔵🔵 🟠🟠 🟢🟢🟢🟢          │              │
│  │   🔵🔵🔵 🟠🟠 🟢🟢🟢🟢          │              │
│  │   🔵🔵🔵 🔵🔵 ⚫⚫⚫⚫          │              │
│  │                               │              │
│  │   🔵 可售  🟠 锁定             │              │
│  │   🟢 已订  ⚫ 已售             │              │
│  └───────────────────────────────┘              │
│                                                 │
│  操作记录：                                      │
│  10:05 - 用户 user-123 锁定座位 1排1座           │
│  10:03 - 订单 order-456 完成支付（2排3-5座）     │
└─────────────────────────────────────────────────┘
```

#### **2. 座位右键菜单**

```
┌─────────────────┐
│ 座位 1排1座      │
├─────────────────┤
│ 状态：锁定 🟠    │
│ 用户：user-123  │
│ 剩余：13:45     │
├─────────────────┤
│ ⚡ 强制解锁      │
│ 📋 查看详情      │
│ 🚫 标记不可售    │
└─────────────────┘
```

---

### **开发任务**

- [ ] **后端 API**
  - [ ] `GET /api/shows/{showId}/seats` - 查询座位状态
  - [ ] `PATCH /api/shows/{showId}/seats/{seatId}` - 更新单座位
  - [ ] `PATCH /api/shows/{showId}/seats/batch` - 批量更新
  - [ ] `GET /api/shows/{showId}/stats` - 座位统计

- [ ] **前端组件**
  - [ ] `ShowSeatMapViewer.tsx` - 演出座位图查看器
  - [ ] `SeatStatusPanel.tsx` - 座位状态面板
  - [ ] `SeatStatsCard.tsx` - 座位统计卡片
  - [ ] `SeatContextMenu.tsx` - 座位右键菜单

- [ ] **工具函数**
  - [ ] `getSeatStatusColor()` - 获取状态颜色
  - [ ] `canUpdateSeatStatus()` - 状态更新权限检查
  - [ ] `calculateSeatStats()` - 座位统计计算

**预计工时：** 4-5 小时

---

## 功能 3：锁座/解锁功能

### **需求描述**
用户选座后自动锁定 15 分钟，超时未支付自动解锁；支持管理员强制解锁。

---

### **核心逻辑**

#### **1. 自动锁座**

```typescript
// 用户点击座位时触发
async function lockSeat(showId: string, seatId: string, userId: string) {
  // 1. 检查座位当前状态
  const seat = await getSeat(showId, seatId);
  
  if (seat.status !== 'available') {
    throw new Error('座位不可选');
  }
  
  // 2. 计算过期时间（15分钟后）
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
  
  // 3. 更新座位状态为"锁定"
  await updateSeat(showId, seatId, {
    status: 'locked',
    lockInfo: {
      userId,
      lockedAt: now,
      expiresAt,
    },
  });
  
  // 4. 创建锁定记录（用于审计）
  await createSeatLock({
    showId,
    seatId,
    userId,
    lockedAt: now,
    expiresAt,
  });
  
  // 5. 启动定时解锁任务
  scheduleAutoUnlock(showId, seatId, expiresAt);
}
```

#### **2. 自动解锁**

```typescript
// 定时任务：每分钟扫描一次过期锁定
async function autoUnlockExpiredSeats() {
  const now = new Date();
  
  // 1. 查询所有过期的锁定座位
  const expiredSeats = await db.query(`
    SELECT * FROM show_seats
    WHERE status = 'locked'
    AND lock_expires_at < $1
  `, [now]);
  
  // 2. 批量解锁
  for (const seat of expiredSeats) {
    await unlockSeat(seat.showId, seat.id, 'timeout');
  }
}

// 解锁单个座位
async function unlockSeat(
  showId: string,
  seatId: string,
  reason: 'timeout' | 'user_cancel' | 'admin_force'
) {
  // 1. 更新座位状态为"可售"
  await updateSeat(showId, seatId, {
    status: 'available',
    lockInfo: null,
  });
  
  // 2. 更新锁定记录
  await updateSeatLock(showId, seatId, {
    result: reason === 'timeout' ? 'expired' : 'cancelled',
    unlockedAt: new Date(),
    unlockReason: reason,
  });
  
  // 3. 发送通知（如果是超时）
  if (reason === 'timeout') {
    await sendNotification(seat.lockInfo.userId, {
      type: 'seat_unlock',
      message: '您的座位已自动解锁，请重新选择',
    });
  }
}
```

#### **3. 支付成功后转换**

```typescript
// 支付成功回调
async function onPaymentSuccess(orderId: string) {
  // 1. 查询订单关联的座位
  const order = await getOrder(orderId);
  const seats = await getOrderSeats(orderId);
  
  // 2. 批量更新座位状态为"已订"
  for (const seat of seats) {
    await updateSeat(order.showId, seat.id, {
      status: 'booked',
      orderId: orderId,
      lockInfo: null, // 清空锁定信息
    });
    
    // 3. 更新锁定记录
    await updateSeatLock(order.showId, seat.id, {
      result: 'converted_to_order',
      orderId: orderId,
      unlockedAt: new Date(),
      unlockReason: 'payment_success',
    });
  }
}
```

---

### **UI 交互**

#### **1. C 端选座界面**

```
┌─────────────────────────────────────────────┐
│  选座购票 - 2025新年音乐会                    │
├─────────────────────────────────────────────┤
│                                             │
│  已选座位：2排3座、2排4座                     │
│  剩余时间：⏱️ 14:32                          │
│                                             │
│  ┌───────────────────────────┐              │
│  │   🎭                       │              │
│  │   🔵🔵🔵 🟠🟠 🟢🟢🟢🟢      │              │
│  │   🔵🔵🔵 ⚡⚡ 🟢🟢🟢🟢      │  ← ⚡ 是当前用户锁定的座位
│  │   🔵🔵🔵 🔵🔵 ⚫⚫⚫⚫      │              │
│  └───────────────────────────┘              │
│                                             │
│  ⚠️ 请在 15 分钟内完成支付，否则座位将自动释放 │
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │  取消选座    │  │  去支付 ¥200 │          │
│  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────┘
```

#### **2. B 端强制解锁**

```
┌─────────────────────────────┐
│  确认强制解锁？              │
├─────────────────────────────┤
│  座位：1排1座                │
│  当前状态：锁定 🟠           │
│  用户：user-123 (张三)       │
│  锁定时间：10:05             │
│  剩余时间：13:45             │
│                             │
│  ⚠️ 强制解锁将导致用户订单失败│
│                             │
│  ┌──────┐  ┌──────┐         │
│  │ 取消  │  │ 确认  │         │
│  └──────┘  └──────┘         │
└─────────────────────────────┘
```

---

### **定时任务设计**

#### **1. 数据库定时任务（PostgreSQL）**

```sql
-- 每分钟执行一次
CREATE OR REPLACE FUNCTION auto_unlock_expired_seats()
RETURNS void AS $$
BEGIN
  UPDATE show_seats
  SET 
    status = 'available',
    lock_user_id = NULL,
    lock_expires_at = NULL,
    updated_at = NOW()
  WHERE 
    status = 'locked'
    AND lock_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 创建定时任务（每分钟）
SELECT cron.schedule(
  'auto-unlock-seats',
  '* * * * *',
  'SELECT auto_unlock_expired_seats();'
);
```

#### **2. 后端定时任务（Node.js）**

```typescript
import { CronJob } from 'cron';

// 每分钟执行一次
const autoUnlockJob = new CronJob(
  '0 * * * * *', // 每分钟第0秒
  async () => {
    try {
      const result = await autoUnlockExpiredSeats();
      console.log(`[Auto Unlock] 已解锁 ${result.count} 个座位`);
    } catch (error) {
      console.error('[Auto Unlock] 解锁失败:', error);
    }
  },
  null,
  true,
  'Asia/Shanghai'
);

autoUnlockJob.start();
```

---

### **开发任务**

- [ ] **后端 API**
  - [ ] `POST /api/shows/{showId}/seats/{seatId}/lock` - 锁定座位
  - [ ] `POST /api/shows/{showId}/seats/{seatId}/unlock` - 解锁座位
  - [ ] `POST /api/shows/{showId}/seats/batch-lock` - 批量锁定
  - [ ] `GET /api/shows/{showId}/locks` - 查询锁定记录

- [ ] **定时任务**
  - [ ] `autoUnlockExpiredSeats()` - 自动解锁定时任务
  - [ ] `cleanupExpiredLocks()` - 清理过期锁定记录

- [ ] **前端组件**
  - [ ] `SeatLockTimer.tsx` - 锁定倒计时组件
  - [ ] `UnlockConfirmModal.tsx` - 解锁确认弹窗
  - [ ] `SeatLockStatus.tsx` - 锁定状态显示

- [ ] **工具函数**
  - [ ] `lockSeat()` - 锁定座位
  - [ ] `unlockSeat()` - 解锁座位
  - [ ] `calculateRemainingTime()` - 计算剩余时间

**预计工时：** 3-4 小时

---

## 功能 4：座位图版本对比

### **需求描述**
对比场馆级和演出级的座位图差异，辅助运营决策是否同步更新。

---

### **业务场景**

#### **场景：场馆调整后**
1. 场馆管理员在场馆级座位图中**新增了 50 个座位**
2. 但演出级座位图是之前的快照，**没有这 50 个座位**
3. 演出经理需要对比差异，决定是否同步

---

### **对比维度**

| 对比项 | 说明 |
|-------|------|
| **新增座位** | 场馆级有，演出级没有 |
| **删除座位** | 场馆级没有，演出级有 |
| **位置变化** | 同一座位（rowLabel + seatLabel），但坐标不同 |
| **座区变化** | 同一座位，但归属座区不同 |

---

### **UI 交互**

#### **对比界面**

```
┌──────────────────────────────────────────────────┐
│  座位图版本对比 - 2025新年音乐会                   │
├──────────────────────────────────────────────────┤
│  场馆级版本：v1702819200000 (2025-12-17 10:00)    │
│  演出级版本：v1702732800000 (2025-12-16 10:00)    │
│                                                  │
│  差异统计：                                       │
│  ┌─────────┬─────────┬─────────┬─────────┐       │
│  │ 新增座位 │ 删除座位 │ 位置变化 │ 座区变化 │       │
│  │   50   │   10   │   20   │   5    │       │
│  └─────────┴─────────┴─────────┴─────────┘       │
│                                                  │
│  对比视图：                                       │
│  ┌────────────────┬────────────────┐             │
│  │  场馆级（新）    │  演出级（旧）    │             │
│  ├────────────────┼────────────────┤             │
│  │  🟢🟢🟢🟢🔵🔵   │  🔵🔵🔵🔵      │             │
│  │  🟢🟢🟢🟢🔵🔵   │  🔵🔵🔵🔵      │             │
│  │  ↑ 新增        │               │             │
│  └────────────────┴────────────────┘             │
│                                                  │
│  差异列表：                                       │
│  🟢 新增座位：                                    │
│     - 1排11座、1排12座、2排11座... (共50个)       │
│  🔴 删除座位：                                    │
│     - 3排5座、3排6座... (共10个)                  │
│  🟡 位置变化：                                    │
│     - 2排3座 (100,200) → (110,205)              │
│                                                  │
│  ⚠️ 警告：演出已有 200 个已售座位，同步可能影响订单 │
│                                                  │
│  ┌─────────────┐  ┌─────────────┐               │
│  │  取消       │  │  同步更新    │               │
│  └─────────────┘  └─────────────┘               │
└──────────────────────────────────────────────────┘
```

---

### **对比算法**

```typescript
/**
 * 对比场馆级和演出级座位图
 */
function compareSeatMaps(
  venueSeats: Seat[],
  showSeats: ShowSeat[]
): SeatMapDiff {
  const diff: SeatMapDiff = {
    added: [],      // 新增座位
    removed: [],    // 删除座位
    moved: [],      // 位置变化
    zoneChanged: [], // 座区变化
  };

  // 1. 建立索引（rowLabel + seatLabel）
  const venueSeatMap = new Map<string, Seat>();
  const showSeatMap = new Map<string, ShowSeat>();

  venueSeats.forEach(seat => {
    const key = `${seat.rowLabel}-${seat.seatLabel}`;
    venueSeatMap.set(key, seat);
  });

  showSeats.forEach(seat => {
    const key = `${seat.rowLabel}-${seat.seatLabel}`;
    showSeatMap.set(key, seat);
  });

  // 2. 查找新增座位（场馆有，演出没有）
  venueSeatMap.forEach((seat, key) => {
    if (!showSeatMap.has(key)) {
      diff.added.push(seat);
    }
  });

  // 3. 查找删除座位（演出有，场馆没有）
  showSeatMap.forEach((seat, key) => {
    if (!venueSeatMap.has(key)) {
      diff.removed.push(seat);
    }
  });

  // 4. 查找位置变化和座区变化
  venueSeatMap.forEach((venueSeat, key) => {
    const showSeat = showSeatMap.get(key);
    if (showSeat) {
      // 位置变化
      if (venueSeat.x !== showSeat.x || venueSeat.y !== showSeat.y) {
        diff.moved.push({
          seat: venueSeat,
          oldPosition: { x: showSeat.x, y: showSeat.y },
          newPosition: { x: venueSeat.x, y: venueSeat.y },
        });
      }
      
      // 座区变化
      if (venueSeat.zoneId !== showSeat.zoneId) {
        diff.zoneChanged.push({
          seat: venueSeat,
          oldZone: showSeat.zoneName || '无座区',
          newZone: venueSeat.zoneName || '无座区',
        });
      }
    }
  });

  return diff;
}
```

---

### **同步策略**

#### **1. 安全同步（推荐）**
- ✅ 只同步**未售出**的座位（status = 'available'）
- ❌ 已售出的座位保持不变
- ⚠️ 新增座位默认状态为"可售"

#### **2. 强制同步（危险）**
- ⚠️ 同步所有座位，包括已售出的
- ⚠️ 需要管理员确认
- ⚠️ 记录操作日志

---

### **开发任务**

- [ ] **后端 API**
  - [ ] `GET /api/shows/{showId}/seat-map-diff` - 获取差异
  - [ ] `POST /api/shows/{showId}/sync-seat-map` - 同步座位图

- [ ] **前端组件**
  - [ ] `SeatMapCompareView.tsx` - 对比视图组件
  - [ ] `SeatMapDiffPanel.tsx` - 差异面板
  - [ ] `SyncConfirmModal.tsx` - 同步确认弹窗

- [ ] **工具函数**
  - [ ] `compareSeatMaps()` - 对比算法
  - [ ] `syncSeatMap()` - 同步逻辑
  - [ ] `canSyncSafely()` - 安全性检查

**预计工时：** 2-3 小时

---

## 📅 开发计划

### **Phase 1：座位图快照（3-4h）**
**Week 1, Day 1-2**

- [ ] Day 1 上午：数据模型设计
  - [ ] 设计 `Show` 模型
  - [ ] 设计 `ShowSeat` 模型
  - [ ] 数据库表创建

- [ ] Day 1 下午：后端 API
  - [ ] 实现快照创建接口
  - [ ] 实现数据复制逻辑
  - [ ] 编写单元测试

- [ ] Day 2 上午：前端组件
  - [ ] 创建演出向导组件
  - [ ] 快照设置面板
  - [ ] 座位图预览

- [ ] Day 2 下午：联调测试
  - [ ] 前后端联调
  - [ ] 测试快照功能
  - [ ] 修复 Bug

---

### **Phase 2：座位状态管理（4-5h）**
**Week 1, Day 3-4**

- [ ] Day 3 上午：状态管理逻辑
  - [ ] 实现状态查询 API
  - [ ] 实现状态更新 API
  - [ ] 实现批量操作 API

- [ ] Day 3 下午：前端组件
  - [ ] 座位图查看器
  - [ ] 座位状态面板
  - [ ] 座位统计卡片

- [ ] Day 4 上午：状态渲染
  - [ ] 实现状态颜色映射
  - [ ] 实现座位图渲染
  - [ ] 实现右键菜单

- [ ] Day 4 下午：测试优化
  - [ ] 功能测试
  - [ ] 性能优化
  - [ ] UI 优化

---

### **Phase 3：锁座/解锁（3-4h）**
**Week 2, Day 1-2**

- [ ] Day 1 上午：锁座逻辑
  - [ ] 实现锁座 API
  - [ ] 实现解锁 API
  - [ ] 实现定时任务

- [ ] Day 1 下午：前端组件
  - [ ] 锁定倒计时
  - [ ] 解锁确认弹窗
  - [ ] 锁定状态显示

- [ ] Day 2：测试部署
  - [ ] 功能测试
  - [ ] 压力测试（并发锁座）
  - [ ] 部署定时任务

---

### **Phase 4：版本对比（2-3h）**
**Week 2, Day 3**

- [ ] 上午：对比算法
  - [ ] 实现对比逻辑
  - [ ] 实现同步逻辑
  - [ ] 实现安全性检查

- [ ] 下午：UI 组件
  - [ ] 对比视图
  - [ ] 差异面板
  - [ ] 同步确认弹窗

---

## ✅ 验收标准

### **功能 1：座位图快照**
- [ ] 创建演出时自动生成快照
- [ ] 快照数据完整（所有座位、座区、楼层）
- [ ] 快照版本号正确生成
- [ ] 演出级座位初始状态为"可售"

### **功能 2：座位状态管理**
- [ ] 座位状态正确显示（可售/锁定/已订/已售）
- [ ] 状态颜色映射正确
- [ ] 座位统计准确
- [ ] 批量操作正常

### **功能 3：锁座/解锁**
- [ ] 用户点击座位后自动锁定
- [ ] 锁定倒计时正确显示
- [ ] 15分钟后自动解锁
- [ ] 支付成功后转为"已订"
- [ ] 管理员强制解锁正常

### **功能 4：版本对比**
- [ ] 差异识别准确（新增/删除/移动/座区变化）
- [ ] 对比视图清晰
- [ ] 同步逻辑正确（只同步未售座位）
- [ ] 安全性检查有效

---

## 📊 数据库设计

### **表 1：shows（演出表）**

```sql
CREATE TABLE shows (
  id VARCHAR(50) PRIMARY KEY,
  venue_id VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  show_time TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL,
  seat_map_version VARCHAR(50) NOT NULL,
  seat_map_snapshot_time TIMESTAMP NOT NULL,
  venue_seats_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_venue_id (venue_id),
  INDEX idx_show_time (show_time),
  INDEX idx_status (status)
);
```

### **表 2：show_seats（演出座位表）**

```sql
CREATE TABLE show_seats (
  id VARCHAR(50) PRIMARY KEY,
  show_id VARCHAR(50) NOT NULL,
  venue_seat_id VARCHAR(50) NOT NULL,
  floor_id VARCHAR(50) NOT NULL,
  zone_id VARCHAR(50),
  zone_name VARCHAR(100),
  row_label VARCHAR(20) NOT NULL,
  seat_label VARCHAR(20) NOT NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  
  -- 锁定信息
  lock_user_id VARCHAR(50),
  lock_started_at TIMESTAMP,
  lock_expires_at TIMESTAMP,
  
  -- 订单信息
  order_id VARCHAR(50),
  
  -- 继承字段
  type VARCHAR(20),
  tags JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_show_id (show_id),
  INDEX idx_status (status),
  INDEX idx_lock_expires (lock_expires_at),
  INDEX idx_order_id (order_id),
  
  FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE
);
```

### **表 3：seat_locks（座位锁定记录表）**

```sql
CREATE TABLE seat_locks (
  id VARCHAR(50) PRIMARY KEY,
  show_id VARCHAR(50) NOT NULL,
  seat_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  locked_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  result VARCHAR(30),
  order_id VARCHAR(50),
  unlocked_at TIMESTAMP,
  unlock_reason VARCHAR(30),
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_show_id (show_id),
  INDEX idx_seat_id (seat_id),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

---

## 📚 参考资料

### **行业案例**
- **猫眼电影：** 座位锁定 10 分钟
- **大麦网：** 座位锁定 15 分钟
- **淘票票：** 座位锁定 15 分钟

### **技术参考**
- jsPDF 文档：https://github.com/parallax/jsPDF
- Ant Design Table：https://ant.design/components/table-cn
- React DnD：https://react-dnd.github.io/react-dnd

---

**文档创建时间：** 2025-12-17  
**文档状态：** ✅ 待确认  
**下一步：** 等待用户确认后开始开发

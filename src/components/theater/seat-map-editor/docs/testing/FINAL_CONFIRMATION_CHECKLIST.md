# ✅ 最终确认清单 - 演出管理模块

**创建时间：** 2025-12-17  
**版本：** v2.0（根据 PRD v1.1 调整后）  
**状态：** 📋 待用户确认

---

## 📋 本次沟通成果

### **1. 已完整阅读 PRD v1.1**
- ✅ 阅读了 [PRD v1.1 Notion 文档](https://www.notion.so/gkf/SaaS-PRD-2cb090a10533802293bbca998944e341)
- ✅ 重点理解了第 8 章：座位结构锁定 & 场馆版本复制策略
- ✅ 理解了第 4 章：精确座位模式 - 演出层售卖模式与票档关系

### **2. 核心理解调整**
- ✅ **演出级不是"快照"，而是"引用+映射"**
  - 演出级不复制座位数据
  - 通过 `show_seat_prices` 表引用场馆级座位
  - 座位的物理属性（x, y, rowLabel, seatLabel）只在场馆级

- ✅ **座位结构锁定规则**
  - 场馆有订单后，结构锁定
  - 禁止删除座位、修改排号/座号、调整座区
  - 允许移动位置、修改颜色、名称
  - 如需调整结构 → 复制场馆创建新版本

- ✅ **不需要"版本对比"功能**
  - 因为结构锁定后不会出现"场馆调整，演出不同步"的场景

### **3. 输出文档**
- ✅ [演出管理模块详细需求 v2.0](./SHOW_MANAGEMENT_REQUIREMENTS_V2.md)
- ✅ [剩余工作总结 v2.0](./REMAINING_WORK_SUMMARY_V2.md)
- ✅ [座位结构锁定功能增强](./SEAT_STRUCTURE_LOCK_ENHANCEMENT.md)

---

## 🎯 调整后的功能清单

### **总计：4 个功能，10-14 小时**

| # | 功能名称 | v1.0 | v2.0 | 预计工时 | 状态 |
|---|---------|------|------|---------|------|
| **1** | ~~座位图快照~~ | 复制座位数据 | **改为"座位-票档映射创建"** | 3-4h | ⏳ 待确认 |
| **2** | 演出级座位状态管理 | 保持不变 | 保持不变 | 3-4h | ⏳ 待确认 |
| **3** | 锁座/解锁功能 | 保持不变 | 保持不变 | 3-4h | ⏳ 待确认 |
| **4** | ~~座位图版本对比~~ | 对比差异 | **删除，改为"座位结构锁定功能"** | 1-2h | ⏳ 待确认 |

---

## 📊 核心概念对比（v1.0 vs v2.0）

### **核心变化：演出级数据模型**

#### **v1.0（错误）：**
```
演出层独立存储座位数据

show_seats 表：
  - id
  - show_id
  - venue_seat_id  ← 引用场馆级（用于关联）
  - x, y           ← 复制座位坐标
  - rowLabel       ← 复制排号
  - seatLabel      ← 复制座号
  - zoneId         ← 复制座区
  - status         ← 演出级状态
```

#### **v2.0（正确）：**
```
演出层只记录映射关系和状态，座位数据在场馆级

show_seat_prices 表（映射表）：
  - id
  - show_id
  - seat_id        ← 引用场馆级 seats.id
  - price_tier_id  ← 票档 ID

show_seat_status 表（状态表）：
  - id
  - show_id
  - seat_id        ← 引用场馆级 seats.id
  - status         ← 演出级状态（可售/锁定/已订/已售）
  - lock_info
  - order_id

座位的 x, y, rowLabel, seatLabel, zoneId 只在场馆级 seats 表！
```

---

## 🔍 详细功能说明

### **功能 1：座位-票档映射创建（3-4h）**

**v1.0 设计（错误）：**
- 复制场馆级座位数据到演出级
- 生成独立的演出级座位 ID
- 每个演出有独立的座位数据副本

**v2.0 设计（正确）：**
- ❌ 不复制座位数据
- ✅ 只创建映射关系：`seat_id → price_tier_id`
- ✅ 座位物理属性永远从场馆级查询

**开发内容：**
- 后端 API：
  - `POST /api/shows/{showId}/price-tiers` - 创建票档
  - `POST /api/shows/{showId}/seat-price-mapping` - 批量分配座位
  - `POST /api/shows/{showId}/seat-price-mapping/by-zone` - 按座区分配
- 前端组件：
  - `PriceTierPanel.tsx` - 票档配置面板
  - `SeatPriceMappingEditor.tsx` - 座位-票档分配编辑器
- 数据库表：
  - `show_price_tiers` - 票档表
  - `show_seat_prices` - 座位-票档映射表

**交付物：**
- ✅ 创建演出时可以配置票档
- ✅ 可以按座区批量分配座位
- ✅ 映射关系正确存储
- ✅ 座位图正确显示票档颜色

---

### **功能 2：演出级座位状态管理（3-4h）**

**核心不变，但数据模型调整：**
- 状态流转：`可售 → 锁定 → 已订 → 已售`
- 状态记录在 `show_seat_status` 表
- 座位物理属性从场馆级 `seats` 表查询

**开发内容：**
- 后端 API：
  - `GET /api/shows/{showId}/seat-status` - 查询座位状态
  - `PATCH /api/shows/{showId}/seat-status/{seatId}` - 更新状态
- 前端组件：
  - `ShowSeatMapViewer.tsx` - 演出座位图查看器
  - `SeatStatusPanel.tsx` - 座位状态面板
- 数据库表：
  - `show_seat_status` - 演出级座位状态表

**关键：**
- 查询演出座位时，需要 JOIN 场馆级 `seats` 表获取 x, y, rowLabel, seatLabel 等属性

---

### **功能 3：锁座/解锁功能（3-4h）**

**核心不变：**
- 用户点击座位 → 锁定 15 分钟
- 超时自动解锁
- 支付成功 → 转为"已订"

**开发内容：**
- 后端 API：
  - `POST /api/shows/{showId}/seats/{seatId}/lock` - 锁定座位
  - `POST /api/shows/{showId}/seats/{seatId}/unlock` - 解锁座位
- 定时任务：
  - `autoUnlockExpiredSeats()` - 每分钟扫描过期锁定
- 前端组件：
  - `SeatLockTimer.tsx` - 锁定倒计时
- 数据库表：
  - `seat_locks` - 座位锁定记录表

---

### **功能 4：座位结构锁定功能（1-2h）**

**v1.0 设计（错误）：**
- 座位图版本对比（对比场馆级和演出级差异）

**v2.0 设计（正确）：**
- 座位结构锁定功能
- 场馆有订单后，禁止结构性修改
- 提供"复制场馆"解决方案

**开发内容：**
- 后端 API：
  - `GET /api/venues/{venueId}/lock-status` - 检查锁定状态
  - `POST /api/venues/{venueId}/copy` - 复制场馆
- 前端组件：
  - `VenueLockWarning.tsx` - 锁定警告横幅
  - `CopyVenueModal.tsx` - 复制场馆弹窗
- 座位图编辑器增强：
  - 初始化时检查锁定状态
  - 根据阶段禁用按钮和输入框
  - 添加 Tooltip 提示

**锁定规则：**
| 阶段 | 触发条件 | 结构性修改 | 显示级调整 |
|------|---------|-----------|-----------|
| A | 未关联演出 | ✅ 允许 | ✅ 允许 |
| B | 已关联演出，但无订单 | ✅ 允许（需提示） | ✅ 允许 |
| C | 已有演出产生订单 | ❌ 禁止 | ✅ 允许 |

---

## 🗂️ 数据库设计

### **核心表结构**

```sql
-- 票档表
CREATE TABLE show_price_tiers (
  id VARCHAR(50) PRIMARY KEY,
  show_id VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  color VARCHAR(20),
  FOREIGN KEY (show_id) REFERENCES shows(id)
);

-- 座位-票档映射表（核心）
CREATE TABLE show_seat_prices (
  id VARCHAR(50) PRIMARY KEY,
  show_id VARCHAR(50) NOT NULL,
  seat_id VARCHAR(50) NOT NULL,  -- 引用 venues.seats.id
  price_tier_id VARCHAR(50) NOT NULL,
  
  UNIQUE KEY unique_show_seat (show_id, seat_id),  -- 一个座位只能属于一个票档
  
  FOREIGN KEY (show_id) REFERENCES shows(id),
  FOREIGN KEY (price_tier_id) REFERENCES show_price_tiers(id)
);

-- 演出级座位状态表
CREATE TABLE show_seat_status (
  id VARCHAR(50) PRIMARY KEY,
  show_id VARCHAR(50) NOT NULL,
  seat_id VARCHAR(50) NOT NULL,  -- 引用 venues.seats.id
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  
  -- 锁定信息
  lock_user_id VARCHAR(50),
  lock_expires_at TIMESTAMP,
  
  -- 订单信息
  order_id VARCHAR(50),
  
  UNIQUE KEY unique_show_seat_status (show_id, seat_id),
  
  FOREIGN KEY (show_id) REFERENCES shows(id)
);

-- 座位锁定记录表
CREATE TABLE seat_locks (
  id VARCHAR(50) PRIMARY KEY,
  show_id VARCHAR(50) NOT NULL,
  seat_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  locked_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  result VARCHAR(30),
  order_id VARCHAR(50)
);
```

**关键：所有表都通过 `seat_id` 引用场馆级 `venues.seats.id`，不复制座位数据！**

---

## 📅 开发计划（2 周）

### **Week 1：核心功能**
- **Day 1-2：** 座位-票档映射创建（3-4h）
- **Day 3-4：** 演出级座位状态管理（3-4h）

### **Week 2：锁座和结构锁定**
- **Day 1-2：** 锁座/解锁功能（3-4h）
- **Day 3：** 座位结构锁定功能（1-2h）

---

## ✅ 验收标准

### **功能 1：座位-票档映射**
- [ ] 创建演出时可以配置票档（VIP / A档 / B档）
- [ ] 可以按座区批量分配座位到票档
- [ ] 可以框选座位分配到票档
- [ ] 映射关系正确存储到 `show_seat_prices` 表
- [ ] 座位图正确显示票档颜色
- [ ] **验证：演出级不复制座位数据，只有映射关系**

### **功能 2：演出级座位状态管理**
- [ ] 座位状态正确显示（可售/锁定/已订/已售）
- [ ] 状态统计准确
- [ ] B 端管理界面清晰
- [ ] **验证：座位物理属性从场馆级查询（JOIN seats 表）**

### **功能 3：锁座/解锁**
- [ ] 用户点击座位自动锁定
- [ ] 倒计时正确显示
- [ ] 15 分钟后自动解锁
- [ ] 支付成功后转为"已订"
- [ ] 定时任务正常运行

### **功能 4：座位结构锁定**
- [ ] 阶段 A（无演出）：所有功能可用
- [ ] 阶段 B（有演出无订单）：修改前弹窗警告
- [ ] 阶段 C（有订单）：结构性修改按钮全部禁用
- [ ] 锁定提示清晰（横幅、Tooltip）
- [ ] 复制场馆功能正常
- [ ] 新场馆包含所有数据，处于阶段 A

---

## ❓ 请您确认以下要点

### **1. 核心理解确认**

**问题 1：演出级数据模型**
- ✅ 您是否认可"演出级不复制座位数据，只通过 seat_id 引用场馆级"的设计？
- ✅ 您是否理解这意味着座位的 x, y, rowLabel, seatLabel, zoneId 只在场馆级存储？

**问题 2：座位结构锁定**
- ✅ 您是否认可"场馆有订单后，结构锁定"的规则？
- ✅ 您是否认可"如需调整结构，复制场馆创建新版本"的解决方案？

**问题 3：功能调整**
- ✅ 您是否认可删除"座位图版本对比"功能（因为结构锁定后不会出现版本差异）？
- ✅ 您是否认可将"座位图快照"改为"座位-票档映射创建"？

---

### **2. 功能清单确认**

- ✅ 功能 1：座位-票档映射创建（3-4h）
- ✅ 功能 2：演出级座位状态管理（3-4h）
- ✅ 功能 3：锁座/解锁功能（3-4h）
- ✅ 功能 4：座位结构锁定功能（1-2h）

**总计：10-14 小时（约 2 周）**

---

### **3. 开发优先级确认**

建议开发顺序：
1. **功能 4（座位结构锁定）** - 前置依赖，先增强座位图编辑器
2. **功能 1（座位-票档映射）** - 演出管理的基础
3. **功能 2（座位状态管理）** - 基于功能 1
4. **功能 3（锁座/解锁）** - 基于功能 2

是否认可这个顺序？

---

### **4. 技术实现确认**

**数据库表确认：**
- ✅ `show_price_tiers` - 票档表
- ✅ `show_seat_prices` - 座位-票档映射表（核心，通过 seat_id 引用）
- ✅ `show_seat_status` - 演出级座位状态表（通过 seat_id 引用）
- ✅ `seat_locks` - 座位锁定记录表

**关键约束确认：**
- ✅ `show_seat_prices` 表有唯一约束：`UNIQUE (show_id, seat_id)` - 一个座位在一场演出中只能属于一个票档
- ✅ 所有表通过 `seat_id` 引用场馆级 `venues.seats.id`，不复制数据

---

## 📚 参考文档

### **已输出文档**
1. [演出管理模块详细需求 v2.0](./SHOW_MANAGEMENT_REQUIREMENTS_V2.md) - 完整需求文档
2. [剩余工作总结 v2.0](./REMAINING_WORK_SUMMARY_V2.md) - 简洁总结
3. [座位结构锁定功能增强](./SEAT_STRUCTURE_LOCK_ENHANCEMENT.md) - 座位图编辑器增强

### **PRD 文档**
- [景区 SaaS · 剧场业务 · 精确座位模式 & 座位图迭代 PRD v1.1](https://www.notion.so/gkf/SaaS-PRD-2cb090a10533802293bbca998944e341)

---

## 🎯 总结

### **本次沟通的核心成果**

1. **阅读并理解了最新 PRD v1.1**
   - 重点：第 8 章座位结构锁定规则
   - 重点：第 4 章演出层售卖模式与票档关系

2. **纠正了 v1.0 的错误设计**
   - ❌ v1.0：演出级复制座位数据（错误）
   - ✅ v2.0：演出级只记录映射关系（正确）

3. **调整了功能清单**
   - 删除：座位图快照、座位图版本对比
   - 新增：座位-票档映射创建、座位结构锁定功能

4. **明确了开发计划**
   - 4 个功能，10-14 小时，2 周周期

---

## ✅ 下一步行动

**请您确认：**

- [ ] 1. 是否认可核心理解（演出级引用场馆级）？
- [ ] 2. 是否认可功能清单（4 个功能）？
- [ ] 3. 是否认可工时估算（10-14 小时）？
- [ ] 4. 是否认可开发优先级（功能 4 → 1 → 2 → 3）？
- [ ] 5. 是否认可数据库设计（4 张表，通过 seat_id 引用）？

**确认后，立即开始开发！** 🚀

---

**文档创建时间：** 2025-12-17  
**文档状态：** 📋 待确认  
**回复格式：** 请直接回复"确认"或提出修改意见

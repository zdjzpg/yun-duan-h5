# 🔒 座位图编辑器增强：座位结构锁定功能

**创建时间：** 2025-12-17  
**PRD 依据：** v1.1 第 8 章 - 座位结构锁定 & 场馆版本复制策略  
**优先级：** 🔴 P0（演出管理模块前置依赖）  
**预计工时：** 1-2 小时

---

## 📋 功能概述

根据 PRD v1.1 第 8 章，场馆的座位结构修改需要受到锁定规则限制，以保护已售出的订单数据。

### **核心规则**

**场馆未被演出引用或引用但未产生订单时：**
- ✅ 允许修改座位结构（新增/删除座位、调整座区、修改排号/座号）

**一旦该场馆下任一演出产生售票订单：**
- ❌ 座位结构即被锁定
- ✅ 只允许显示级调整（移动位置、修改颜色、名称）
- ❌ 禁止删除座位、修改排号/座号、调整座区

**解决方案：**
- 如需调整结构 → 通过"复制场馆"创建新版本

---

## 🎯 需求分析

### **三个阶段**

| 阶段 | 触发条件 | 结构性修改 | 显示级调整 | 实现位置 |
|------|---------|-----------|-----------|---------|
| **A** | 场馆新建，未关联演出 | ✅ 允许 | ✅ 允许 | 前端：正常编辑 |
| **B** | 已关联演出，但无订单 | ✅ 允许（需提示） | ✅ 允许 | 前端：弹窗警告 |
| **C** | **已有演出产生订单** | ❌ **禁止** | ✅ 允许 | 前端：禁用按钮 + 提示 |

### **结构性修改 vs 显示级调整**

#### **结构性修改（阶段 C 禁止）**
- ❌ 删除座位（Delete 按钮、右键菜单）
- ❌ 修改排号/座号（属性面板输入框）
- ❌ 调整座区归属（拖拽到其他座区、属性面板下拉框）
- ❌ 删除座区（座区管理面板）
- ❌ 删除楼层（楼层管理面板）
- ❌ 新增座位（批量生成、单个添加）

#### **显示级调整（阶段 C 允许）**
- ✅ 移动座位位置（拖拽改变 x, y）
- ✅ 修改座区名称（座区属性面板）
- ✅ 修改座区颜色（座区属性面板）
- ✅ 修改舞台形状和位置（舞台属性面板）
- ✅ 修改座位标签/备注（属性面板）

---

## 🔧 实现方案

### **1. 后端 API 设计**

#### **检查场馆锁定状态**

```typescript
GET /api/venues/{venueId}/lock-status

Response:
{
  "locked": boolean,              // 是否锁定
  "stage": "A" | "B" | "C",       // 当前阶段
  "reason": string,               // 锁定原因
  "orderCount": number,           // 订单数量（阶段C）
  "showCount": number,            // 关联演出数量（阶段B/C）
  "affectedShows": [              // 受影响的演出（阶段B/C）
    {
      "showId": string,
      "showName": string,
      "orderCount": number
    }
  ]
}
```

**示例响应：**

```json
// 阶段 A：未关联演出
{
  "locked": false,
  "stage": "A",
  "reason": "",
  "orderCount": 0,
  "showCount": 0,
  "affectedShows": []
}

// 阶段 B：已关联演出，但无订单
{
  "locked": false,
  "stage": "B",
  "reason": "该场馆已关联 2 个演出，修改结构前请确认",
  "orderCount": 0,
  "showCount": 2,
  "affectedShows": [
    {
      "showId": "show-1",
      "showName": "2025新年音乐会",
      "orderCount": 0
    },
    {
      "showId": "show-2",
      "showName": "圣诞音乐会",
      "orderCount": 0
    }
  ]
}

// 阶段 C：已有订单
{
  "locked": true,
  "stage": "C",
  "reason": "该场馆下的演出已产生 50 个订单，座位结构已锁定",
  "orderCount": 50,
  "showCount": 2,
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

---

### **2. 前端实现**

#### **2.1 座位图编辑器初始化时检查锁定状态**

```typescript
// /components/theater/seat-map-editor/index.tsx

import { useEffect, useState } from 'react';
import { message } from 'antd';

export function SeatMapEditor({ venueId }: Props) {
  const [lockStatus, setLockStatus] = useState<VenueLockStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 组件挂载时检查锁定状态
    checkVenueLockStatus();
  }, [venueId]);

  const checkVenueLockStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/venues/${venueId}/lock-status`);
      const data = await response.json();
      setLockStatus(data);
      
      // 阶段 B：显示警告
      if (data.stage === 'B') {
        message.warning(data.reason, 5);
      }
      
      // 阶段 C：显示严重警告
      if (data.stage === 'C') {
        message.error({
          content: data.reason,
          duration: 0,  // 不自动关闭
          key: 'venue-locked',
        });
      }
    } catch (error) {
      console.error('检查锁定状态失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 判断是否允许结构性修改
  const allowStructuralChanges = lockStatus?.stage !== 'C';

  return (
    <div>
      {/* 锁定警告横幅 */}
      {lockStatus?.locked && (
        <VenueLockWarning lockStatus={lockStatus} />
      )}
      
      {/* 座位图编辑器 */}
      <Canvas />
      
      {/* 工具栏（根据锁定状态禁用按钮） */}
      <Toolbar allowStructuralChanges={allowStructuralChanges} />
      
      {/* 属性面板（根据锁定状态禁用输入框） */}
      <PropertiesPanel allowStructuralChanges={allowStructuralChanges} />
    </div>
  );
}
```

---

#### **2.2 锁定警告横幅组件**

```typescript
// /components/theater/seat-map-editor/VenueLockWarning.tsx

import { Alert, Button } from 'antd';
import { LockOutlined, CopyOutlined } from '@ant-design/icons';

interface Props {
  lockStatus: VenueLockStatus;
}

export function VenueLockWarning({ lockStatus }: Props) {
  const handleCopyVenue = () => {
    // 打开复制场馆弹窗
    Modal.confirm({
      title: '复制场馆',
      content: '是否复制该场馆创建新版本？新场馆将拥有独立的 ID，可自由修改座位结构。',
      onOk: async () => {
        await copyVenue(lockStatus.venueId);
      },
    });
  };

  return (
    <Alert
      type={lockStatus.stage === 'C' ? 'error' : 'warning'}
      showIcon
      icon={<LockOutlined />}
      message={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <strong>座位结构锁定</strong>
            <div style={{ marginTop: 4 }}>
              {lockStatus.reason}
            </div>
            <div style={{ marginTop: 8, fontSize: 12 }}>
              允许操作：移动座位位置、修改颜色、名称<br />
              禁止操作：删除座位、修改排号/座号、调整座区
            </div>
          </div>
          <Button
            type="primary"
            icon={<CopyOutlined />}
            onClick={handleCopyVenue}
          >
            复制场馆
          </Button>
        </div>
      }
      closable={lockStatus.stage !== 'C'}  // 阶段 C 不可关闭
      style={{ marginBottom: 16 }}
    />
  );
}
```

---

#### **2.3 工具栏按钮禁用**

```typescript
// /components/theater/seat-map-editor/TopToolbar.tsx

interface Props {
  allowStructuralChanges: boolean;
}

export function TopToolbar({ allowStructuralChanges }: Props) {
  return (
    <div className="toolbar">
      {/* 删除按钮 - 结构性修改 */}
      <Tooltip
        title={
          allowStructuralChanges
            ? '删除选中的座位'
            : '该场馆已有订单，无法删除座位。如需调整，请复制场馆创建新版本。'
        }
      >
        <Button
          icon={<DeleteOutlined />}
          onClick={handleDelete}
          disabled={!allowStructuralChanges}  // 阶段 C 禁用
        >
          删除
        </Button>
      </Tooltip>

      {/* 批量生成按钮 - 结构性修改 */}
      <Tooltip
        title={
          allowStructuralChanges
            ? '批量生成座位'
            : '该场馆已有订单，无法新增座位'
        }
      >
        <Button
          icon={<PlusOutlined />}
          onClick={handleBatchGenerate}
          disabled={!allowStructuralChanges}  // 阶段 C 禁用
        >
          批量生成
        </Button>
      </Tooltip>

      {/* 对齐按钮 - 显示级调整，始终允许 */}
      <Button
        icon={<AlignLeftOutlined />}
        onClick={handleAlign}
      >
        对齐
      </Button>
    </div>
  );
}
```

---

#### **2.4 属性面板输入框禁用**

```typescript
// /components/theater/seat-map-editor/PropertiesPanel.tsx

interface Props {
  allowStructuralChanges: boolean;
}

export function PropertiesPanel({ allowStructuralChanges }: Props) {
  return (
    <div className="properties-panel">
      <Typography.Title level={5}>座位属性</Typography.Title>

      {/* 排号 - 结构性修改 */}
      <Form.Item label="排号">
        <Input
          value={seat.rowLabel}
          onChange={handleRowLabelChange}
          disabled={!allowStructuralChanges}  // 阶段 C 禁用
          placeholder={
            allowStructuralChanges
              ? '输入排号'
              : '已锁定，无法修改'
          }
        />
      </Form.Item>

      {/* 座号 - 结构性修改 */}
      <Form.Item label="座号">
        <Input
          value={seat.seatLabel}
          onChange={handleSeatLabelChange}
          disabled={!allowStructuralChanges}  // 阶段 C 禁用
          placeholder={
            allowStructuralChanges
              ? '输入座号'
              : '已锁定，无法修改'
          }
        />
      </Form.Item>

      {/* 座区 - 结构性修改 */}
      <Form.Item label="座区">
        <Select
          value={seat.zoneId}
          onChange={handleZoneChange}
          disabled={!allowStructuralChanges}  // 阶段 C 禁用
          placeholder={
            allowStructuralChanges
              ? '选择座区'
              : '已锁定，无法修改'
          }
        >
          {zones.map(zone => (
            <Select.Option key={zone.id} value={zone.id}>
              {zone.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {/* 坐标 - 显示级调整，始终允许 */}
      <Form.Item label="X 坐标">
        <InputNumber
          value={seat.x}
          onChange={handleXChange}
        />
      </Form.Item>

      <Form.Item label="Y 坐标">
        <InputNumber
          value={seat.y}
          onChange={handleYChange}
        />
      </Form.Item>
    </div>
  );
}
```

---

#### **2.5 阶段 B 警告弹窗**

```typescript
// 当用户在阶段 B 执行结构性修改时，弹窗确认

const handleStructuralChange = (action: string) => {
  if (lockStatus?.stage === 'B') {
    Modal.confirm({
      title: '确认修改',
      content: (
        <div>
          <p>{lockStatus.reason}</p>
          <p>修改座位结构后，需要重新检查以下演出的票档配置：</p>
          <ul>
            {lockStatus.affectedShows.map(show => (
              <li key={show.showId}>{show.showName}</li>
            ))}
          </ul>
          <p><strong>是否继续？</strong></p>
        </div>
      ),
      onOk: () => {
        // 执行修改
        performAction(action);
      },
    });
  } else if (lockStatus?.stage === 'A') {
    // 阶段 A：直接执行
    performAction(action);
  } else {
    // 阶段 C：不应该执行到这里（按钮已禁用）
    message.error('该场馆已有订单，无法修改座位结构');
  }
};
```

---

### **3. 复制场馆功能**

#### **3.1 复制场馆 API**

```typescript
POST /api/venues/{venueId}/copy

Request Body:
{
  "newVenueName": "北京音乐厅（v2）"  // 可选，默认添加 "(副本)"
}

Response:
{
  "success": true,
  "data": {
    "newVenueId": "venue-2",
    "newVenueName": "北京音乐厅（v2）",
    "copiedSeats": 1200,
    "copiedZones": 5,
    "copiedFloors": 2,
    "copiedStage": true
  }
}
```

#### **3.2 复制场馆弹窗**

```typescript
// /components/theater/venue-management/CopyVenueModal.tsx

import { Modal, Form, Input, message } from 'antd';

interface Props {
  venueId: string;
  venueName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: (newVenueId: string) => void;
}

export function CopyVenueModal({ venueId, venueName, open, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleCopy = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const response = await fetch(`/api/venues/${venueId}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      
      const data = await response.json();
      
      if (data.success) {
        message.success(`场馆复制成功！新场馆：${data.data.newVenueName}`);
        onSuccess(data.data.newVenueId);
        onClose();
      }
    } catch (error) {
      message.error('复制失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="复制场馆"
      open={open}
      onOk={handleCopy}
      onCancel={onClose}
      confirmLoading={loading}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          newVenueName: `${venueName}（v2）`,
        }}
      >
        <Form.Item
          label="新场馆名称"
          name="newVenueName"
          rules={[{ required: true, message: '请输入场馆名称' }]}
        >
          <Input placeholder="输入新场馆名称" />
        </Form.Item>

        <Alert
          type="info"
          message="复制说明"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>将复制所有座位、座区、楼层、舞台配置</li>
              <li>新场馆拥有独立的 ID，可自由修改座位结构</li>
              <li>旧场馆保留，用于历史演出和订单查询</li>
              <li>后续演出请配置到新场馆</li>
            </ul>
          }
          style={{ marginTop: 16 }}
        />
      </Form>
    </Modal>
  );
}
```

---

## 📋 开发任务清单

### **后端 API（预计 0.5h）**

- [ ] `GET /api/venues/{venueId}/lock-status` - 检查锁定状态
  - [ ] 查询场馆关联的演出数量
  - [ ] 查询演出的订单数量
  - [ ] 计算锁定阶段（A / B / C）
  - [ ] 返回锁定状态和原因

- [ ] `POST /api/venues/{venueId}/copy` - 复制场馆
  - [ ] 复制场馆基础信息
  - [ ] 复制舞台配置
  - [ ] 复制楼层（floors）
  - [ ] 复制座区（zones）
  - [ ] 复制座位（seats）
  - [ ] 返回新场馆 ID

---

### **前端组件（预计 1h）**

- [ ] `VenueLockWarning.tsx` - 锁定警告横幅
  - [ ] 显示锁定原因
  - [ ] 显示允许/禁止的操作
  - [ ] "复制场馆"按钮

- [ ] `CopyVenueModal.tsx` - 复制场馆弹窗
  - [ ] 输入新场馆名称
  - [ ] 显示复制说明
  - [ ] 调用复制 API

---

### **座位图编辑器增强（预计 0.5h）**

- [ ] **初始化时检查锁定状态**
  - [ ] 调用 `GET /api/venues/{venueId}/lock-status`
  - [ ] 存储锁定状态到 state
  - [ ] 根据阶段显示警告

- [ ] **工具栏按钮禁用**
  - [ ] 删除按钮（阶段 C 禁用）
  - [ ] 批量生成按钮（阶段 C 禁用）
  - [ ] 添加 Tooltip 提示

- [ ] **属性面板输入框禁用**
  - [ ] 排号输入框（阶段 C 禁用）
  - [ ] 座号输入框（阶段 C 禁用）
  - [ ] 座区下拉框（阶段 C 禁用）

- [ ] **阶段 B 警告弹窗**
  - [ ] 结构性修改前弹窗确认
  - [ ] 显示受影响的演出列表

- [ ] **座区管理面板**
  - [ ] 删除座区按钮（阶段 C 禁用）

- [ ] **楼层管理面板**
  - [ ] 删除楼层按钮（阶段 C 禁用）

---

## ✅ 验收标准

### **阶段 A：未关联演出**
- [ ] 检查锁定状态 API 返回 `stage: "A", locked: false`
- [ ] 所有编辑功能正常可用
- [ ] 不显示锁定警告横幅

### **阶段 B：已关联演出，但无订单**
- [ ] 检查锁定状态 API 返回 `stage: "B", locked: false`
- [ ] 显示警告横幅（warning 级别）
- [ ] 执行结构性修改前弹窗确认
- [ ] 弹窗显示受影响的演出列表

### **阶段 C：已有订单**
- [ ] 检查锁定状态 API 返回 `stage: "C", locked: true`
- [ ] 显示严重警告横幅（error 级别，不可关闭）
- [ ] 结构性修改按钮全部禁用
- [ ] Tooltip 显示锁定提示
- [ ] 排号/座号/座区输入框禁用
- [ ] "复制场馆"按钮可用

### **复制场馆功能**
- [ ] 点击"复制场馆"打开弹窗
- [ ] 输入新场馆名称
- [ ] 复制成功后返回新场馆 ID
- [ ] 新场馆包含所有座位、座区、楼层、舞台数据
- [ ] 新场馆处于阶段 A（可自由编辑）

---

## 📊 UI 效果展示

### **阶段 A：正常编辑**

```
┌─────────────────────────────────────────────────┐
│  座位图编辑器 - 北京音乐厅                        │
├─────────────────────────────────────────────────┤
│  [批量生成] [删除] [对齐] ...                     │  ← 所有按钮可用
│                                                 │
│  [Canvas 座位图]                                 │
│                                                 │
│  属性面板：                                      │
│  排号：[1    ] ← 可编辑                          │
│  座号：[1    ] ← 可编辑                          │
│  座区：[正厅A区 ▼] ← 可编辑                      │
└─────────────────────────────────────────────────┘
```

---

### **阶段 B：警告提示**

```
┌─────────────────────────────────────────────────┐
│  座位图编辑器 - 北京音乐厅                        │
├─────────────────────────────────────────────────┤
│  ⚠️ 警告：该场馆已关联 2 个演出，修改结构前请确认  │  ← 警告横幅
│                                                 │
│  [批量生成] [删除] [对齐] ...                     │  ← 所有按钮可用
│                                                 │
│  点击删除时弹窗：                                 │
│  ┌─────────────────────────────┐                │
│  │  确认修改                    │                │
│  │                             │                │
│  │  修改后需重新检查演出：       │                │
│  │  - 2025新年音乐会            │                │
│  │  - 圣诞音乐会                │                │
│  │                             │                │
│  │  [取消] [确认]               │                │
│  └─────────────────────────────┘                │
└─────────────────────────────────────────────────┘
```

---

### **阶段 C：锁定状态**

```
┌─────────────────────────────────────────────────┐
│  座位图编辑器 - 北京音乐厅                        │
├─────────────────────────────────────────────────┤
│  🔒 座位结构锁定                                  │  ← 严重警告横幅
│  该场馆下的演出已产生 50 个订单，座位结构已锁定    │
│  允许：移动位置、修改颜色、名称                    │
│  禁止：删除座位、修改排号/座号、调整座区           │
│                                    [复制场馆]     │  ← 复制按钮
├─────────────────────────────────────────────────┤
│  [批量生成 ✖] [删除 ✖] [对齐]                     │  ← 结构性按钮禁用
│   ↑ Tooltip: 该场馆已有订单，无法新增座位          │
│                                                 │
│  [Canvas 座位图]  ← 仍可拖拽移动位置              │
│                                                 │
│  属性面板：                                      │
│  排号：[1    ✖] ← 禁用                           │
│  座号：[1    ✖] ← 禁用                           │
│  座区：[正厅A区 ✖] ← 禁用                        │
│  X坐标：[100  ] ← 可编辑                         │
│  Y坐标：[200  ] ← 可编辑                         │
└─────────────────────────────────────────────────┘
```

---

## 🎯 总结

### **实现要点**

1. **后端 API（0.5h）**
   - 检查锁定状态（查询演出和订单数量）
   - 复制场馆（复制所有结构数据）

2. **前端组件（1h）**
   - 锁定警告横幅
   - 复制场馆弹窗
   - 座位图编辑器权限控制

3. **座位图编辑器增强（0.5h）**
   - 初始化时检查锁定状态
   - 根据阶段禁用按钮和输入框
   - 添加 Tooltip 提示

### **关键点**

- ✅ 阶段 C 时，所有结构性修改入口全部禁用
- ✅ 提供"复制场馆"解决方案
- ✅ 旧场馆保留用于历史订单查询

---

**文档创建时间：** 2025-12-17  
**文档状态：** ✅ 待开发  
**预计工时：** 1-2 小时  
**优先级：** 🔴 P0（演出管理模块前置依赖）

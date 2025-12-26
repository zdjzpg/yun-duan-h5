# 场馆锁定功能文档

## 功能概览

场馆锁定功能用于保护已经投入使用的场馆座位结构，避免在已有订单或被演出引用的情况下随意修改座位结构，影响已购票用户或排期数据的一致性。

---

## 核心组件

### 1. VenueLockAlert - 场馆锁定提示

**功能：**
- 显示当前场馆是否处于“座位结构已锁定”状态（黄色警告条）。  
- 说明锁定原因（有订单 / 被演出引用）。  
- 提示允许和禁止的操作范围：  
  - 禁止：增删座位、调整座位坐标等结构性修改。  
  - 允许：座位标签、座区颜色等展示级调整。  
- 提供“复制场馆创建新版本”的入口按钮。

**Props：**
```ts
type VenueLockAlertProps = {
  lockStatus: VenueLockStatus
  showCopyButton?: boolean
}
```

**典型用法：**
```vue
<VenueLockAlert
  v-if="lockStatus"
  :lock-status="lockStatus"
  :show-copy-button="true"
  @copy="() => (copyModalVisible = true)"
/>
```

---

### 2. CopyVenueModal - 复制场馆弹窗

**功能：**
- 输入新场馆名称（默认“原名称 - 副本”）。  
- 勾选是否复制座位数据（楼层、座区、座位坐标等）。  
- 调用 `/theater/venues/copy` 接口完成复制。  
- 复制成功后返回新场馆 ID，通常跳转到新场馆的编辑页面。

**Props：**
```ts
type CopyVenueModalProps = {
  sourceVenueId: string
  sourceVenueName: string
  open: boolean
}
```

**Events：**
```ts
// 关闭弹窗
emit('close')

// 复制成功
emit('success', newVenueId: string)
```

**典型用法：**
```vue
<CopyVenueModal
  v-if="lockStatus"
  :open="copyModalVisible"
  :source-venue-id="venueId"
  :source-venue-name="initialValues?.name || ''"
  @close="copyModalVisible = false"
  @success="handleCopySuccess"
/>
```

---

## API 接口

### 1. checkVenueLockStatus - 检查场馆锁定状态

```ts
async function checkVenueLockStatus(venueId: string): Promise<VenueLockStatus>
```

**返回数据：**
```ts
type VenueLockStatus = {
  venueId: string
  isLocked: boolean
  lockReason?: 'has_orders' | 'has_referenced_shows'
  referencedShowCount: number
  totalOrders: number
  lastCheckedAt: string
}
```

### 2. copyVenue - 复制场馆

```ts
async function copyVenue(request: CopyVenueRequest): Promise<CopyVenueResponse>
```

**请求参数：**
```ts
type CopyVenueRequest = {
  sourceVenueId: string
  newVenueName?: string
  copySeatData?: boolean
}
```

**返回数据：**
```ts
type CopyVenueResponse = {
  newVenueId: string
  venue: Venue
}
```

---

## 使用场景

### 场景 1：场馆编辑页顶部提示

在 `VenueEdit` 页面中：

- 页面加载时通过 `checkVenueLockStatus(id)` 获取锁定状态。  
- 若 `isLocked === true`：  
  - 在表单上方显示 `VenueLockAlert` 提示条。  
  - 提供“复制场馆创建新版本”按钮，点击后打开 `CopyVenueModal`。  
  - 复制成功后跳转到新场馆编辑页。

### 场景 2：与精确座位编辑器配合

当场馆已锁定时：

- 通过提示条告知用户当前座位结构已锁定；  
- 推荐使用“复制场馆 + 精确座位编辑器”来创建一个新版本，再在新版本上进行结构性调整；  
- 这样可以避免对已有订单或正在售卖的演出产生影响。


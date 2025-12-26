# 座位图编辑器 - 数据校验与二次确认功能

## ✅ 已实现功能

### 1️⃣ **保存时数据校验（混合提示方案）**

#### 实现文件
- `/components/theater/seat-map-editor/validation.utils.ts` - 校验工具函数
- `/components/theater/seat-map-editor/SeatMapEditorModal.tsx` - Modal 层面集成校验

#### 校验规则（3项）

##### A. 必须有舞台
```typescript
// 规则：seatMapConfig.stage 不能为空
// 错误提示：座位图必须包含舞台，请先添加舞台
// 错误级别：❌ 阻断保存
```

##### B. 至少有 1 个座位
```typescript
// 规则：seats.length >= 1
// 错误提示：座位图至少需要一个座位
// 错误级别：❌ 阻断保存
```

##### C. 座位唯一性
```typescript
// 规则：同一楼层内，rowLabel + seatLabel 组合必须唯一
// 错误提示：一层存在重复座位：1排1座
// 错误级别：❌ 阻断保存
```

#### 提示方案

**单个错误：**
```typescript
// 使用 message.error() 轻量提示
message.error('座位图必须包含舞台，请先添加舞台');
```

**多个错误：**
```typescript
// 使用 Modal.error() 集中展示
Modal.error({
  title: '座位图数据校验失败',
  content: (
    <div>
      <p>请修正以下 2 个问题后再保存：</p>
      <ul>
        <li>座位图必须包含舞台，请先添加舞台</li>
        <li>一层存在重复座位：1排1座</li>
      </ul>
    </div>
  ),
  okText: '我知道了',
});
```

---

### 2️⃣ **关闭时二次确认**

#### 实现文件
- `/components/theater/seat-map-editor/SeatMapEditorModal.tsx`

#### 触发条件
```typescript
// 当 hasUnsavedChanges.current === true 时触发
// 标记时机：编辑器数据变化（handleEditorChange 被调用）
```

#### 二次确认弹窗
```typescript
modal.confirm({
  title: '有未保存的修改',
  icon: <ExclamationCircleOutlined />,
  content: '座位图编辑器有未保存的修改，关闭后将丢失所有更改，确定要关闭吗？',
  okText: '确定关闭',
  okButtonProps: { danger: true },
  cancelText: '取消',
  onOk: () => {
    // 关闭 Modal
  },
});
```

#### 触发场景
1. ✅ 点击 Modal 的 **关闭按钮（×）**
2. ✅ 点击 Modal 的 **取消按钮**
3. ❌ 按下 **ESC 键**（已禁用 `keyboard={false}`）
4. ❌ 点击 Modal **遮罩层**（已禁用 `maskClosable={false}`）

---

### 3️⃣ **实时校验（子 Modal）**

#### 座区名称唯一性校验

**实现文件：**
- `/components/theater/seat-map-editor/ZoneConfigModal.tsx`

**校验时机：**
- 点击"确定"按钮时

**校验逻辑：**
```typescript
const isDuplicate = existingZones.some(
  (z) => z.name === values.name && z.id !== zone?.id
);

if (isDuplicate) {
  form.setFields([
    {
      name: 'name',
      errors: ['该楼层已存在同名座区'],
    },
  ]);
  return; // 阻断保存
}
```

---

#### 楼层名称唯一性校验

**实现文件：**
- `/components/theater/seat-map-editor/FloorManagerModal.tsx`

**校验时机：**
- 修改楼层名称时（实时校验）

**校验逻辑：**
```typescript
const isDuplicate = editingFloors.some(
  (f) => f.id !== floorId && f.name === newName.trim()
);

if (isDuplicate) {
  message.warning('楼层名称不能重复');
  return; // 阻断保存
}
```

---

## 🎯 数据变化场景（会触发 hasUnsavedChanges）

### A. 座位操作
1. ✅ 添加座位
2. ✅ 删除座位
3. ✅ 移动座位
4. ✅ 修改座位属性（排号、座号）
5. ✅ 修改座位状态（可用/禁用）
6. ✅ 批量分配座区

### B. 座区操作
1. ✅ 创建座区
2. ✅ 修改座区（名称、颜色、简称）
3. ✅ 删除座区
4. ✅ 调整座区顺序

### C. 楼层操作
1. ✅ 创建楼层
2. ✅ 修改楼层（名称、顺序）
3. ✅ 删除楼层
4. ✅ 切换当前楼层

### D. 舞台操作
1. ✅ 添加舞台
2. ✅ 移动舞台
3. ✅ 修改舞台属性（形状、尺寸、颜色、名称）
4. ✅ 删除舞台

### E. 命令栈操作
- ✅ 撤销/重做（触发上述任一数据变化）

---

## 📋 测试清单

### 保存校验测试

- [ ] **测试 A1**：没有舞台时点击"完成"，显示错误提示
- [ ] **测试 A2**：没有座位时点击"完成"，显示错误提示
- [ ] **测试 A3**：同一楼层存在重复座位（1排1座）时点击"完成"，显示错误提示
- [ ] **测试 A4**：同时有多个错误（无舞台+无座位），显示 Modal 集中展示
- [ ] **测试 A5**：只有一个错误，显示 message 轻量提示
- [ ] **测试 A6**：所有校验通过，成功保存并显示"座位图保存成功"

### 关闭确认测试

- [ ] **测试 B1**：没有任何修改时点击"取消"，直接关闭（无二次确认）
- [ ] **测试 B2**：添加座位后点击"取消"，弹出二次确认
- [ ] **测试 B3**：点击 Modal 关闭按钮（×），弹出二次确认
- [ ] **测试 B4**：确认弹窗点击"确定关闭"，成功关闭 Modal
- [ ] **测试 B5**：确认弹窗点击"取消"，留在编辑器中
- [ ] **测试 B6**：按 ESC 键，编辑器内部处理（取消选择），不关闭 Modal
- [ ] **测试 B7**：点击遮罩层，不关闭 Modal（已禁用）

### 实时校验测试

- [ ] **测试 C1**：创建座区时，输入已存在的名称，提示"该楼层已存在同名座区"
- [ ] **测试 C2**：编辑座区时，修改为与其他座区重名，提示错误
- [ ] **测试 C3**：修改楼层名称为已存在的名称，提示"楼层名称不能重复"

---

## 🔧 代码结构

```
seat-map-editor/
├── validation.utils.ts                # ✅ 新增：数据校验工具
├── SeatMapEditorModal.tsx            # ✅ 修改：集成校验和二次确认
├── ZoneConfigModal.tsx                # ✅ 已有：座区名称唯一性校验
├── FloorManagerModal.tsx              # ✅ 已有：楼层名称唯一性校验
└── useHistory.ts                      # ✅ 已有：命令栈（用于判断是否有修改）
```

---

## 📖 使用示例

### 基础用法
```tsx
<SeatMapEditorModal
  initialData={venueData}
  onChange={(data) => {
    console.log('座位图已保存:', data);
  }}
  buttonText="编辑座位图"
/>
```

### 保存失败示例
```typescript
// 用户点击"完成"按钮
handleOk() {
  // 执行校验
  const result = validateTheaterData(tempData);
  
  if (!result.success) {
    // 单个错误
    if (result.errors.length === 1) {
      message.error(result.errors[0].message);
    }
    // 多个错误
    else {
      Modal.error({
        title: '座位图数据校验失败',
        content: (
          <ul>
            {result.errors.map(e => <li>{e.message}</li>)}
          </ul>
        ),
      });
    }
    return; // 阻断保存
  }
  
  // 校验通过，保存数据
  onChange(tempData);
  message.success('座位图保存成功');
}
```

---

## ✨ 实现亮点

1. **混合提示方案**：单错误轻量提示，多错误集中展示，兼顾体验和效率
2. **无感知追踪**：使用 `useRef` 追踪修改状态，不影响渲染性能
3. **分层校验**：子 Modal 实时校验（座区/楼层名称），主 Modal 最终校验（座位唯一性/必填项）
4. **用户友好**：错误提示包含具体位置（楼层名称、排号座号），便于快速定位问题
5. **类型安全**：完整的 TypeScript 类型定义，编译时发现错误

---

## 📝 后续优化建议

### 可选增强
1. **错误高亮**：校验失败时，在画布上高亮重复的座位
2. **自动修复**：提供"自动重新编号"按钮，一键修复重复座位
3. **批量校验**：支持批量导入时的校验和预览
4. **历史对比**：显示本次编辑的变更摘要（新增X个座位，删除Y个座区）

### 性能优化
1. **防抖校验**：座位唯一性校验较重，可以在用户停止编辑后300ms再执行
2. **增量校验**：只校验本次修改的数据，而不是全量校验
3. **Web Worker**：大量座位（>1000）时，使用 Worker 进行异步校验

---

**📅 实现日期：** 2024-12-24  
**✅ 实现状态：** 已完成  
**🎯 测试状态：** 待测试

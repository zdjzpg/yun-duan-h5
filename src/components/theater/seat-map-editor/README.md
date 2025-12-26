# 🎭 座位图编辑器

**景区 SaaS 剧场业务管理系统 - 核心模块**

一个基�?React + TypeScript + Ant Design 的专业级座位图编辑器，支持多楼层、座区管理、精确选座等完整的剧场座位管理功能�?
---

## �?核心特�?
### 📐 三种容量模式

- **自由站席�?* 无固定座位，只设置容量上�?- **按座区数量：** 按区域设置座位数量，不精确到具体位置
- **精确座位模式�?* 完整的座位图编辑器（本模块）

### 🎯 核心功能

#### 基础编辑（阶�?1-2�?- �?座位绘制：单个绘制、批量生成、自由拖�?- �?选择操作：单选、框选、Shift 多�?- �?编辑操作：复制、剪切、粘贴、删除、撤销/重做
- �?对齐工具：左对齐、右对齐、居中对齐、顶对齐、底对齐、垂直居�?
#### 高级功能（阶�?3-4�?- �?座位状态：可售、禁售、设备位、遮�?- �?座位标签：VIP、无障碍
- �?座位编号：自动编号、批量重新编�?- �?舞台管理：添加舞台、调整方向、设置颜�?- �?背景图：上传、调整、透明度控�?
#### 多楼层管理（阶段 5�?- �?楼层切换：快速切换不同楼�?- �?楼层管理：新建、编辑、删除、排�?- �?独立编辑：每个楼层独立的座位、舞台、背景图

#### 座区管理（阶�?6）⭐ 最�?- �?座区创建：选择座位 �?创建座区（一步到位）
- �?座区编辑：修改名称、颜色、简称、顺�?- �?座区删除：删除座区，座位保留
- �?座区颜色：自动渲染座区颜色（浅色背景�?- �?两种售卖方式：区票（按座区售卖）、精确选座（按座位售卖�?
---

## 🚀 快速开�?
### 1. 新成员入职（必读�?
**阅读顺序�?5 分钟）：**

```
1️⃣ QUICK_REFERENCE.md�? 分钟�?   �?了解三大核心原则和开发前三问

2️⃣ DESIGN_PRINCIPLES.md�?0 分钟�?   �?深入理解设计理念和思考方�?
3️⃣ PHASE6_4_REFACTOR_SUMMARY.md�?0 分钟�?   �?通过真实案例学习

4️⃣ 开始开�?�?```

**文档入口�?* �?[DOCS_INDEX.md](./docs/overview/DOCS_INDEX.md)

---

### 2. 开发新功能

**开发前�?*
- [ ] 阅读 [QUICK_REFERENCE.md](./docs/overview/QUICK_REFERENCE.md)
- [ ] 回答"开发前三问"：这是什么？怎么用？会出错吗�?- [ ] 对比真实世界：剧场管理员如何操作�?
**开发中�?*
- [ ] 对照 [DESIGN_PRINCIPLES.md](./docs/overview/DESIGN_PRINCIPLES.md) 的检查清�?- [ ] 确保符合三大核心原则

**开发后�?*
- [ ] 创建阶段文档（`PHASE{X}_{Y}_XXX.md`�?- [ ] 更新 [DOCS_INDEX.md](./docs/overview/DOCS_INDEX.md)

---

### 3. 使用组件

```tsx
import { SeatMapEditor } from '@/components/theater/seat-map-editor';

function VenuePage() {
  const [theaterData, setTheaterData] = useState(null);

  return (
    <SeatMapEditor
      initialData={theaterData}
      onChange={(data) => setTheaterData(data)}
      isInModal={false}
    />
  );
}
```

**Props�?*

| 属�?| 类型 | 默认�?| 说明 |
|------|------|--------|------|
| `initialData` | `TheaterData \| any` | `undefined` | 初始数据（支持旧版数据自动迁移） |
| `onChange` | `(data: TheaterData) => void` | `undefined` | 数据变化回调 |
| `isInModal` | `boolean` | `false` | 是否�?Modal 中使�?|

---

## 🎯 三大核心原则（必记）

### 1️⃣ 观众视角

**统一使用"观众面向舞台"的视�?*

```
观众坐在座位上，面向舞台�?- 左手�?= 1 号座
- 右手�?= 最大号�?- 前排 = �?1 �?- 后排 = 最大排
```

**为什么重要：**
- 避免视角混乱，导致选座时左右颠�?- 确保数据一致性，无需视角转换逻辑
- 符合观众的真实购票体�?
---

### 2️⃣ 座区是标签，不是容器 �?核心

**座位 = 坐标点，座区 = 标签**

```
�?错误理解�?   座区 = 容器，座�?= 内容
   先建容器 �?再装内容

�?正确理解�?   座位 = 坐标点（物理位置�?   座区 = 标签（业务属性）
   先有座位 �?再贴标签
```

**正确的创建流程：**

```
1. �?Canvas 上绘制座�?2. 选择一组座�?3. 右键 �?创建座区
4. 填写名称、颜�?5. 确定 �?完成（座位已有座区属性）
```

**为什么重要：**
- 不会创建"无意义的数据"（空座区�?- 一步到位，交互流畅
- 符合剧场座位的真实管理方�?
---

### 3️⃣ 通道是空�?
**不需要绘制，座位间隙自然形成**

```
座位 = 坐标点（需要绘制）
座区 = 标签（选座位创建）
通道 = 空白区域（不需要绘制）
```

**为什么重要：**
- 避免过度设计
- 简化编辑器逻辑
- 符合真实剧场的布局方式

---

## 📚 文档导航

### 🔥 必读文档

| 文档 | 描述 | 时长 |
|------|------|------|
| **[QUICK_REFERENCE.md](./docs/overview/QUICK_REFERENCE.md)** | �?快速参考卡片（开发前必看�?| 5 分钟 |
| **[DESIGN_PRINCIPLES.md](./docs/overview/DESIGN_PRINCIPLES.md)** | 🎯 设计原则与思考方式（深入理解�?| 20 分钟 |
| **[DOCS_INDEX.md](./docs/overview/DOCS_INDEX.md)** | 📚 文档索引（完整导航） | - |

### 📖 阶段文档

| 文档 | 描述 | 状�?|
|------|------|------|
| **[PHASE6_4_REFACTOR_SUMMARY.md](./docs/history/PHASE6_4_REFACTOR_SUMMARY.md)** | 座区创建流程重构总结 | �?已完�?|
| **[PHASE6_4_BUGFIX.md](./docs/history/PHASE6_4_BUGFIX.md)** | 座区颜色显示 Bug 修复 | �?已完�?|

### 🗂�?技术文�?
| 文件 | 描述 |
|------|------|
| `types.simplified.ts` | TypeScript 类型定义 |
| `constants.ts` | 常量配置（颜色、尺寸等�?|
| `canvas.utils.ts` | Canvas 渲染工具函数 |
| `migration.utils.ts` | 数据迁移和转换工�?|

---

## 🏗�?项目结构

```
seat-map-editor/
├── README.md                           # 📖 本文�?├── DOCS_INDEX.md                       # 📚 文档索引
├── QUICK_REFERENCE.md                  # �?快速参考卡�?├── DESIGN_PRINCIPLES.md                # 🎯 设计原则
├── PHASE6_4_REFACTOR_SUMMARY.md        # 🔄 重构总结
├── PHASE6_4_BUGFIX.md                  # 🐛 Bug 修复记录
�?├── index.layout-refactor.tsx           # 🎨 主编辑器组件
├── types.simplified.ts                 # 📐 类型定义
├── constants.ts                        # ⚙️ 常量配置
├── canvas.utils.ts                     # 🖼�?Canvas 渲染工具
├── migration.utils.ts                  # 🔄 数据迁移工具
�?├── SeatMapEditorLayout.tsx             # 📐 布局组件
├── TopToolbar.tsx                      # 🔝 顶部工具�?├── LeftPanel.tsx                       # ◀�?左侧楼层面板
├── RightPanel.tsx                      # ▶️ 右侧属性面�?├── CanvasArea.tsx                      # 🖼�?中间画布区域
�?├── TheaterCanvas.simplified.tsx        # 🎨 Canvas 画布
├── ContextMenu.tsx                     # 🖱�?右键菜单
├── SeatEditPanel.tsx                   # ✏️ 座位编辑面板
├── StageEditPanel.tsx                  # 🎭 舞台编辑面板
├── FloorInfoPanel.tsx                  # 📋 楼层信息面板
├── BackgroundImagePanel.tsx            # 🖼�?背景图面�?�?├── BatchGenerateModal.tsx              # 📦 批量生成弹窗
├── FloorManagerModal.tsx               # 🏢 楼层管理弹窗
├── RenumberModal.tsx                   # 🔢 重新编号弹窗
├── SingleSeatModal.tsx                 # 💺 单座位编辑弹�?├── ZoneConfigModal.tsx                 # �?座区配置弹窗
├── KeyboardShortcutsModal.tsx          # ⌨️ 快捷键说明弹�?�?├── ExportPanel.tsx                     # 📤 导出面板
├── ZoneListPanel.tsx                   # 📋 座区列表面板（待集成�?└── useHistory.ts                       # ⏱️ 历史记录 Hook（撤销/重做�?```

---

## 🎨 设计规范

### 颜色系统

**座位状态颜色：**
```typescript
available: '#FFFFFF'     // 可售 - 白色
disabled: '#F5F5F5'      // 禁售 - 浅灰
equipment: '#E6F7FF'     // 设备�?- 浅蓝
blocked: '#FFF1F0'       // 遮挡 - 浅红
```

**座位标签颜色�?*
```typescript
vip: '#FFF7E6'           // VIP - 浅金�?accessible: '#F9F0FF'    // 无障�?- 浅紫
```

**座区预设颜色�?*
```typescript
'#F5222D'  // 红色
'#FA541C'  // 橙色
'#FA8C16'  // 亮橙
'#FAAD14'  // 金色
'#FADB14'  // 黄色
'#52C41A'  // 绿色
'#13C2C2'  // 青色
'#1890FF'  // 蓝色
'#2F54EB'  // 深蓝
'#722ED1'  // 紫色
```

**座区颜色渲染�?*
- 使用 15% 透明度（`alpha: 0.15`�?- 避免颜色过于饱和
- 保持座位编号可读�?
---

### 尺寸规范

```typescript
SEAT_CONFIG = {
  SIZE: 30,              // 座位大小
  MARGIN: 2,             // 座位边距
  FONT_SIZE: 9,          // 座位编号字体大小
  BORDER_WIDTH: 1.5,     // 座位边框宽度
}

SEAT_SPACING = {
  ROW_SPACING: 40,       // 行间�?  SEAT_SPACING: 36,      // 列间�?}

STAGE_CONFIG = {
  MIN_WIDTH: 100,        // 舞台最小宽�?  MIN_HEIGHT: 40,        // 舞台最小高�?  DEFAULT_WIDTH: 300,    // 舞台默认宽度
  DEFAULT_HEIGHT: 60,    // 舞台默认高度
}
```

---

## ⌨️ 键盘快捷�?
### 基础操作

| 快捷�?| 功能 |
|--------|------|
| `Ctrl + A` | 全选座�?|
| `Ctrl + C` | 复制选中座位 |
| `Ctrl + X` | 剪切选中座位 |
| `Ctrl + V` | 粘贴座位 |
| `Ctrl + D` | 快速复制座�?|
| `Delete` / `Backspace` | 删除选中座位 |
| `Escape` | 取消选择 |
| `Enter` | 编辑选中座位（单选） |

### 视图控制

| 快捷�?| 功能 |
|--------|------|
| `Ctrl + =` / `Ctrl + +` | 放大视图 |
| `Ctrl + -` | 缩小视图 |
| `Ctrl + 0` | 重置视图 |

### 对齐操作

| 快捷�?| 功能 |
|--------|------|
| `Alt + A` | 左对�?|
| `Alt + D` | 右对�?|
| `Alt + H` | 水平居中 |
| `Alt + W` | 顶对�?|
| `Alt + S` | 底对�?|
| `Alt + V` | 垂直居中 |

### 高级操作

| 快捷�?| 功能 |
|--------|------|
| `Ctrl + Z` | 撤销 |
| `Ctrl + Shift + Z` / `Ctrl + Y` | 重做 |
| `Ctrl + G` | 成组 |
| `Ctrl + Shift + G` | 取消成组 |
| `Ctrl + L` | 锁定座位 |
| `Ctrl + Shift + L` | 解锁座位 |
| `Ctrl + R` | 批量重新编号 |
| `Ctrl + E` | 导出座位�?|
| `Ctrl + Shift + N` | 新建楼层 |
| `?` | 显示快捷键说�?|

---

## 🔧 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Ant Design 5.x** - UI 组件�?- **Canvas API** - 座位图渲�?- **TanStack Router** - 路由管理

---

## 📊 开发进�?
### �?已完成（阶段 1-7�?
- [x] 阶段 1：基础绘制功能
- [x] 阶段 2：选择和编辑操�?- [x] 阶段 3：座位状态和标签
- [x] 阶段 4：舞台和背景�?- [x] 阶段 5：多楼层管理
- [x] 阶段 6：座区管�?  - [x] 阶段 6.1：数据模型设�?  - [x] 阶段 6.2-6.3：座区管理功能（已废弃）
  - [x] 阶段 6.4：座区创建流程重�?�?  - [x] 阶段 6.5：舞台模型重构（场馆级单例）
- [x] 阶段 7：座区管理面板优�?�?  - [x] P1：移除创建空座区功能 �?  - [x] P1：完善座区列表展�?�?  - [x] P1：集成到左侧面板（可折叠）✅
  - [ ] P2：座区拖拽排序（可选）
  - [ ] P2：座区快速筛选（可选）

### �?待开发（阶段 8+�?
- [ ] 阶段 8：演出级功能
  - [ ] 座位图快照（从场馆级复制到演出级�?  - [ ] 演出级座位状态管�?  - [ ] 锁座/解锁功能
  - [ ] 座位图版本对�?
- [ ] 阶段 9：性能优化
  - [ ] Canvas 渲染优化（虚拟滚动）
  - [ ] 大量座位场景优化�?000+ 座位�?  - [ ] 历史记录优化（增量存储）

- [ ] 阶段 10：导出优�?  - [ ] 导出为图片（PNG、SVG�?  - [ ] 导出�?PDF
  - [ ] 打印优化

---

## 🧪 测试

### 手动测试清单

**座区创建流程�?*
- [ ] 选择座位 �?右键 �?创建座区
- [ ] 选择座位 �?右侧面板 �?创建座区
- [ ] 未选择座位时，提示"请先选择座位"
- [ ] 创建成功后，座位立即显示座区颜色
- [ ] 座位�?`zoneId`、`zoneName`、`zoneColor` 正确同步

**座区颜色显示�?*
- [ ] VIP区（红色）→ 座位显示浅红色背�?- [ ] 普通区（蓝色）�?座位显示浅蓝色背�?- [ ] 标签颜色优先级高于座区颜�?- [ ] 删除座区后，座位恢复为状态颜�?
**边界情况�?*
- [ ] 同一楼层座区重名 �?提示错误
- [ ] 删除座区 �?座位保留，失去座区属�?- [ ] 删除楼层 �?座区一起删�?
---

## 🐛 已知问题

**无已知问�?* �?
如果发现问题，请创建 Bugfix 文档�?1. 创建 `PHASE{X}_{Y}_BUGFIX.md`
2. 描述问题现象、根本原因、修复方�?3. 更新 [DOCS_INDEX.md](./docs/overview/DOCS_INDEX.md)

---

## 🤝 贡献指南

### 开发新功能

1. **开发前�?* 阅读 [QUICK_REFERENCE.md](./docs/overview/QUICK_REFERENCE.md)
2. **开发中�?* 对照 [DESIGN_PRINCIPLES.md](./docs/overview/DESIGN_PRINCIPLES.md) 的检查清�?3. **开发后�?* 创建阶段文档（`PHASE{X}_{Y}_XXX.md`�?
### Code Review

1. 打开 [QUICK_REFERENCE.md](./docs/overview/QUICK_REFERENCE.md)
2. 检查是否符合三大核心原�?3. 对照开发检查清单，逐项验证

### 文档维护

**发现新的思维误区�?*
- 更新 [DESIGN_PRINCIPLES.md](./docs/overview/DESIGN_PRINCIPLES.md) �?常见思维误区"
- 更新 [QUICK_REFERENCE.md](./docs/overview/QUICK_REFERENCE.md) �?三大思维陷阱"

**完成新功能：**
- 创建阶段文档（`PHASE{X}_{Y}_XXX.md`�?- 更新 [DOCS_INDEX.md](./docs/overview/DOCS_INDEX.md)
- 更新�?README �?开发进�?

---

## 📞 联系方式

**文档问题�?* �?Issue 或直接修改文�? 
**功能建议�?* 在团队会议上讨论  
**Bug 反馈�?* 创建 Bugfix 文档

---

## 📄 许可�?
本项目为公司内部项目，版权归公司所有�?
---

## 🎉 致谢

感谢所有为座位图编辑器做出贡献的团队成员！

**特别致谢�?*
- 产品团队：提供清晰的产品理念�?座区是标签，不是容器"�?- 设计团队：提供专业的交互设计和视觉规�?- 开发团队：高质量的代码实现和持续优�?
---

**最后更新：** 2025-12-17  
**文档维护�?* 开发团队全体成�? 
**文档状态：** �?活跃维护

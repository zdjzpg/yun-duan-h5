# 📋 方案 G 剩余功能清单

**文档创建时间：** 2025-12-14  
**最后更新时间：** 2025-12-16  
**当前状态：** 阶段 5 已完成，准备后续功能

---

## 🎯 方案 G 原始规划概览

### **完整阶段规划**

```
✅ 阶段 1：基础重构（已完成）
✅ 阶段 2：核心功能（已完成）
✅ 阶段 3：精确座位功能（已完成）
✅ 阶段 4：舞台管理增强（已完成）
✅ 阶段 5：背景图管理集成（已完成）- 2025-12-16 🎉
⏳ 阶段 6：高级选择工具（未开始）
⏳ 阶段 7：性能优化（未开始）
```

---

## ✅ **已完成功能（阶段 1-5）**

### **阶段 1：基础重构** ✅
- ✅ 专业编辑器布局（Figma 风格）
- ✅ 左侧工具栏
- ✅ 顶部对齐工具栏
- ✅ 右侧属性面板
- ✅ 底部状态栏
- ✅ Canvas 画布系统
- ✅ 多楼层数据模型

### **阶段 2：核心功能** ✅
- ✅ **拖拽绘制座区** - 鼠标拖拽创建矩形座区
- ✅ **走道绘制** - 拖拽创建横向/纵向走道
- ✅ **舞台添加** - 拖拽创建舞台，选择朝向
- ✅ **楼层管理** - 添加/删除/重命名/排序楼层
- ✅ **批量排座** - 快速生成网格座位（带预览）

### **阶段 3：精确座位功能** ✅
- ✅ **3.1 单座位工具** - 点击添加单个座位
- ✅ **3.2 座位拖拽** - 拖拽移动座位
- ✅ **3.3 批量框选** - 矩形框选多个座位
- ✅ **3.4 对齐工具** - 6 种对齐方式（左/右/上/下/水平/垂直）
- ✅ **3.5 复制粘贴** - 复制粘贴座位（Ctrl+C/V/D）
- ✅ **3.6 批量编号** - 批量重新编号（水平/垂直优先）
- ✅ **3.7 键盘快捷键** - 20+ 快捷键（工具切换/编辑/视图）
- ✅ **3.8 撤销重做** - 历史记录系统（Ctrl+Z/Shift+Z）
- ✅ **3.9 右键菜单** - 上下文菜单（座位/座区/走道/舞台）

### **阶段 4：舞台管理增强** ✅
- ✅ **4.1 舞台编辑面板** - 名称、颜色、朝向、尺寸、位置
- ✅ **4.2 舞台列表管理** - 多舞台支持
- ✅ **4.3 舞台属性实时更新** - 修改立即反映到画布

### **阶段 5：背景图管理集成** ✅ **2025-12-16 完成**
- ✅ **5.1 背景图上传** - PNG/JPG，最大10MB，Base64存储
- ✅ **5.2 背景图列表管理** - 多张背景图支持
- ✅ **5.3 背景图属性编辑** - 透明度、位置、尺寸调整
- ✅ **5.4 显示/隐藏切换** - 快速切换背景图可见性
- ✅ **5.5 锁定/解锁** - 防止误操作
- ✅ **5.6 背景图渲染** - 最底层绘制，图片缓存优化
- ✅ **5.7 楼层隔离** - 每个楼层独立的背景图列表
- ✅ **5.8 导入导出支持** - JSON数据包含backgroundImages

---

## ⏳ **未开始功能（阶段 6-7）**

### **阶段 6：高级选择工具（推荐）**
**优先级：** P1（高）  
**预计工时：** 8-12h

**功能描述：**
- 支持多边形选择工具
- 支持复杂形状选择
- 支持选择区域内的所有座位
- 支持选择区域内的所有座区
- 支持选择区域内的所有走道
- 支持选择区域内的所有舞台

**技术方案：**
```typescript
// 使用 Path2D 创建多边形选择区域
const createSelectionPath = (points: { x: number, y: number }[]) => {
  const path = new Path2D();
  path.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(p => path.lineTo(p.x, p.y));
  path.closePath();
  return path;
};

// 检查座位是否在选择区域内
const isSeatInSelection = (seat: Seat, path: Path2D) => {
  const ctx = canvas.getContext('2d');
  return ctx.isPointInPath(path, seat.x, seat.y);
};

// 选择区域内的所有座位
const selectSeatsInPath = (path: Path2D) => {
  const selectedSeats = seats.filter(seat => isSeatInSelection(seat, path));
  setSelectedSeats(selectedSeats);
};
```

**涉及文件：**
- `/components/theater/seat-map-editor/SelectionTool.tsx` - **新建**
- `/components/theater/seat-map-editor/index.tsx` - 添加选择工具按钮

---

### **阶段 7：性能优化（未开始）**

#### **7.1 Canvas 渲染优化** ⚡
**优先级：** P1（推荐）  
**预计工时：** 4-5h

**功能描述：**
- 视口裁剪（只渲染可见区域）
- 脏矩形检测（只重绘变化区域）
- 分层渲染（背景层 + 座位层 + UI层）
- requestAnimationFrame 优化

**技术方案：**
```typescript
// 视口裁剪
const isInViewport = (element, viewport) => {
  return !(
    element.x > viewport.x + viewport.width ||
    element.x + element.width < viewport.x ||
    element.y > viewport.y + viewport.height ||
    element.y + element.height < viewport.y
  );
};

const renderFrame = () => {
  const viewport = calculateViewport();
  
  // 只渲染可见元素
  const visibleSeats = seats.filter(s => isInViewport(s, viewport));
  visibleSeats.forEach(drawSeat);
  
  requestAnimationFrame(renderFrame);
};
```

---

#### **7.2 虚拟滚动** 📜
**优先级：** P2（可选）  
**预计工时：** 5-6h

**功能描述：**
- 大量座位时（1000+）使用虚拟滚动
- 只渲染可见区域内的座位
- 动态加载/卸载座位

**技术方案：**
```typescript
// 使用 react-window
import { VariableSizeGrid } from 'react-window';

const VirtualSeatGrid = ({ seats }) => (
  <VariableSizeGrid
    columnCount={100}
    columnWidth={(index) => 40}
    height={600}
    rowCount={100}
    rowHeight={(index) => 40}
    width={800}
  >
    {({ columnIndex, rowIndex, style }) => (
      <div style={style}>
        <Seat seat={seats[rowIndex * 100 + columnIndex]} />
      </div>
    )}
  </VariableSizeGrid>
);
```

---

#### **7.3 Web Worker 计算** 🧮
**优先级：** P2（可选）  
**预计工时：** 3-4h

**功能描述：**
- 将复杂计算（对齐、分布、碰撞检测）移到 Web Worker
- 避免阻塞主线程
- 提升 UI 响应速度

**技术方案：**
```typescript
// worker.ts
self.addEventListener('message', (e) => {
  const { type, data } = e.data;
  
  if (type === 'ALIGN_SEATS') {
    const aligned = alignSeats(data.seats, data.direction);
    self.postMessage({ type: 'ALIGN_COMPLETE', data: aligned });
  }
});

// 主线程
const worker = new Worker('./worker.ts');
worker.postMessage({ type: 'ALIGN_SEATS', data: { seats, direction: 'left' } });
worker.onmessage = (e) => {
  if (e.data.type === 'ALIGN_COMPLETE') {
    setSeats(e.data.data);
  }
};
```

---

#### **7.4 数据结构优化** 🗂️
**优先级：** P2（可选）  
**预计工时：** 2-3h

**功能描述：**
- 使用空间索引（R-Tree）加速查询
- 座位数据扁平化存储
- 减少不必要的深拷贝

**技术方案：**
```typescript
// 使用 rbush 库创建空间索引
import RBush from 'rbush';

const tree = new RBush();

// 插入座位
seats.forEach(seat => {
  tree.insert({
    minX: seat.x,
    minY: seat.y,
    maxX: seat.x + 20,
    maxY: seat.y + 20,
    seat,
  });
});

// 快速查询矩形区域内的座位
const seatsInArea = tree.search({
  minX: 100,
  minY: 100,
  maxX: 300,
  maxY: 300,
});
```

---

## 📊 **功能统计**

### **已完成功能**
- **阶段 1：** 7 个功能 ✅
- **阶段 2：** 5 个功能 ✅
- **阶段 3：** 9 个功能 ✅
- **阶段 4：** 3 个功能 ✅
- **阶段 5：** 8 个功能 ✅
- **总计：** 32 个功能 ✅

### **未开始功能**
- **阶段 6：** 1 个功能 ⏳
- **阶段 7：** 4 个功能 ⏳
- **总计：** 5 个功能 ⏳

### **完成度**
```
已完成：32 个功能（80%）
未开始：5 个功能（20%）
```

---

## 🎯 **未开始功能优先级分析**

### **高优先级（推荐实现）**
1. ✅ **高级选择工具（6.1）** - 提升选择灵活性
2. ✅ **Canvas 渲染优化（7.1）** - 性能提升明显

### **中优先级（可选实现）**
3. ⚠️ **虚拟滚动（7.2）** - 大规模座位图需要
4. ⚠️ **Web Worker（7.3）** - 优化收益不大
5. ⚠️ **数据结构���化（7.4）** - 当前性能已足够

---

## 💡 **简化设计后的影响**

### **将被删除的功能**
根据"选项 1：采用简化设计"，以下功能将**不再需要**：

1. ❌ **拖拽绘制座区（2.1）** - 座区变成逻辑属性
2. ❌ **走道绘制（2.2）** - 走道是座位之间的空白
3. ❌ **舞台工具（2.3）** - 舞台保留，但简化

### **将被保留的功能**
1. ✅ **单座位工具** - 核心功能
2. ✅ **批量排座** - 快速生成座位
3. ✅ **座位拖拽** - 精确调整
4. ✅ **对齐工具** - 整齐排列
5. ✅ **复制粘贴** - 快速复制
6. ✅ **撤销重做** - 安全编辑
7. ✅ **键盘快捷键** - 高效操作
8. ✅ **楼层管理** - 多楼层支持

### **简化后仍然推荐的功能**
1. ✅ **背景图导入** - 在平面图上标注座位
2. ✅ **座位图导出** - 导出图片和数据
3. ✅ **Canvas 渲染优化** - 提升性能

---

## 📋 **简化重构后的开发建议**

### **立即实现（第一优先级）**
1. 简化数据结构（删除 Zone、Aisle）
2. 简化 UI（删除座区、走道工具）
3. 保留核心座位功能

### **近期实现（第二优先级）**
1. 背景图导入功能（实用性强）
2. 座位图导出功能（实用性强）

### **长期规划（可选）**
1. Canvas 渲染优化（性能提升）
2. 座位图模板库（提升效率）

---

## 📊 **工作量估算**

### **简化重构**
- 数据结构简化：2-3h
- UI 简化：2-3h
- 测试和文档：2h
- **总计：** 6-8h（1 天）

### **简化后推荐功能**
- 背景图导入：3-4h
- 座位图导出：2-3h
- Canvas 优化：4-5h
- **总计：** 9-12h（1.5 天）

### **简化方案总工作量**
- **简化重构 + 推荐功能：** 15-20h（2.5 天）

---

## 🎯 **总结**

### **方案 G 原始规划**
- ✅ 阶段 1-3：已完成（21 个功能）
- ✅ 阶段 4-5：已完成（11 个功能）
- ⏳ 阶段 6-7：未开始（5 个功能）

### **简化设计的影响**
- ❌ 删除复杂功能：座区绘制、走道绘制
- ✅ 保留核心功能：座位编辑、楼层管理
- ✅ 推荐增强功能：背景图、导出

### **下一步行动**
1. ✅ **确认简化方案** - 删除座区、走道工具
2. ✅ **数据结构重构** - 简化为座位 + 舞台
3. ✅ **UI 简化** - 只保留座位相关工具
4. ✅ **实现推荐功能** - 背景图导入、座位图导出

---

**文档创建时间：** 2025-12-14  
**最后更新时间：** 2025-12-16  
**当前状态：** 准备实施简化重构  
**预计完成时间：** 2-3 天

---

**提示：** 此文档详细列出了方案 G 的所有未开始功能，以及简化设计对这些功能的影响。简化后的编辑器将更加简洁、易用、高效！🎉
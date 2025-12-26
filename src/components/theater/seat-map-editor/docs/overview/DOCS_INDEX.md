# 📚 座位图编辑器 - 文档索引

**最后更新：** 2025-12-17

---

## 🎯 快速导航

### 🔥 必读文档（新成员入职必看）

1. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - ⚡ 快速参考卡片
   - 三大核心原则
   - 开发前三问
   - 检查清单
   - 记忆口诀
   - **时长：5 分钟**

2. **[DESIGN_PRINCIPLES.md](./DESIGN_PRINCIPLES.md)** - 🎯 设计原则与思考方式
   - 核心设计理念详解
   - 常见思维误区分析
   - 正确的思考方式
   - 完整的开发检查清单
   - 案例复盘与经验教训
   - **时长：20 分钟**

---

## 📖 阶段文档（按时间顺序）

### 阶段 6：座区管理功能

#### 6.1 数据模型设计
- **文件：** 暂无单独文档
- **内容：** Zone 类型定义、座位-座区关联关系

#### 6.2 座区管理功能（初版，已废弃）
- **文件：** 暂无单独文档
- **内容：** handleCreateZone（创建空座区）
- **状态：** ❌ 已废弃（违背产品理念）

#### 6.3 座区分配功能（补丁，已废弃）
- **文件：** 暂无单独文档
- **内容：** handleAssignSeatsToZone（后期分配）
- **状态：** ❌ 已废弃（打补丁式设计）

#### 6.4 座区创建流程重构（正确实现）
- **[PHASE6_4_REFACTOR_SUMMARY.md](./PHASE6_4_REFACTOR_SUMMARY.md)** - 🔄 重构总结
  - 旧逻辑分析
  - 新逻辑设计
  - 设计理念对比
  - 阶段演进历史
  - 废弃的代码
  - 新增的功能
  - **状态：** ✅ 已完成

- **[PHASE6_4_BUGFIX.md](./PHASE6_4_BUGFIX.md)** - 🐛 Bug 修复记录
  - 问题：座区颜色未显示
  - 根本原因：Canvas 渲染未使用 zoneColor
  - 修复方案：添加 hexToRgba 函数
  - 颜色优先级设计
  - 验证测试步骤
  - **状态：** ✅ 已完成

---

## 🗂️ 按主题分类

### 设计理念（必读）

| 文档 | 描述 | 时长 |
|------|------|------|
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | 快速参考卡片，开发前必看 | 5 分钟 |
| [DESIGN_PRINCIPLES.md](./DESIGN_PRINCIPLES.md) | 完整的设计原则和思考方式 | 20 分钟 |

### 功能实现

| 文档 | 描述 | 状态 |
|------|------|------|
| [PHASE6_4_REFACTOR_SUMMARY.md](./PHASE6_4_REFACTOR_SUMMARY.md) | 座区创建流程重构总结 | ✅ 已完成 |
| [PHASE6_4_BUGFIX.md](./PHASE6_4_BUGFIX.md) | 座区颜色显示 Bug 修复 | ✅ 已完成 |
| [PRD_COMPLIANCE_CHECK.md](./PRD_COMPLIANCE_CHECK.md) | PRD 合规性检查报告 | ⚠️ 发现 2 个偏离项 |

### 技术规范

| 文档 | 描述 | 状态 |
|------|------|------|
| types.simplified.ts | TypeScript 类型定义 | ✅ 活跃维护 |
| constants.ts | 常量配置（颜色、尺寸等） | ✅ 活跃维护 |
| canvas.utils.ts | Canvas 渲染工具函数 | ✅ 活跃维护 |

---

## 🔍 按角色查找

### 产品经理

**了解产品理念：**
1. [DESIGN_PRINCIPLES.md](./DESIGN_PRINCIPLES.md) - 第 1-3 节（核心设计理念）
2. [PHASE6_4_REFACTOR_SUMMARY.md](./PHASE6_4_REFACTOR_SUMMARY.md) - 设计理念对比

**查看功能实现：**
1. [PHASE6_4_REFACTOR_SUMMARY.md](./PHASE6_4_REFACTOR_SUMMARY.md) - 用户交互流程

### 新入职开发

**第 1 天：快速上手**
1. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - 5 分钟了解核心原则
2. [DESIGN_PRINCIPLES.md](./DESIGN_PRINCIPLES.md) - 20 分钟深入理解

**第 2-3 天：深入学习**
1. [PHASE6_4_REFACTOR_SUMMARY.md](./PHASE6_4_REFACTOR_SUMMARY.md) - 案例学习
2. [PHASE6_4_BUGFIX.md](./PHASE6_4_BUGFIX.md) - 技术细节

### 功能开发者

**开发前：**
1. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - 检查清单
2. [DESIGN_PRINCIPLES.md](./DESIGN_PRINCIPLES.md) - 开发前三问

**开发中：**
1. types.simplified.ts - 类型定义
2. constants.ts - 配置常量

**开发后：**
1. [DESIGN_PRINCIPLES.md](./DESIGN_PRINCIPLES.md) - 回顾检查清单

### Code Reviewer

**Review 清单：**
1. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - 检查是否符合三大原则
2. [DESIGN_PRINCIPLES.md](./DESIGN_PRINCIPLES.md) - 对照开发检查清单

**常见问题：**
1. 是否允许创建"无意义的数据"？
2. 是否符合"座区是标签"的理念？
3. 是否处理了所有边界情况？

---

## 📋 文档维护规范

### 何时更新文档？

**发现新的思维误区时：**
1. 在 `DESIGN_PRINCIPLES.md` 的"常见思维误区"章节添加案例
2. 更新 `QUICK_REFERENCE.md` 的"三大思维陷阱"
3. 在本文档记录更新日志

**完成新功能时：**
1. 创建阶段文档（如 `PHASE6_5_XXX.md`）
2. 在本文档的"阶段文档"章节添加链接
3. 更新相关的检查清单

**发现 Bug 并修复时：**
1. 创建 Bugfix 文档（如 `PHASE6_4_BUGFIX.md`）
2. 在本文档的"功能实现"章节添加链接
3. 分析根本原因，更新设计原则

### 文档命名规范

```
DESIGN_PRINCIPLES.md       - 设计原则（通用）
QUICK_REFERENCE.md         - 快速参考（通用）
PHASE{X}_{Y}_XXX.md        - 阶段文档（X.Y 是阶段号）
PHASE{X}_{Y}_BUGFIX.md     - Bug 修复记录
DOCS_INDEX.md              - 文档索引（本文件）
```

---

## 🔄 更新日志

### 2025-12-17
- ✅ 创建 `DESIGN_PRINCIPLES.md` - 设计原则与思考方式
- ✅ 创建 `QUICK_REFERENCE.md` - 快速参考卡片
- ✅ 创建 `PHASE6_4_REFACTOR_SUMMARY.md` - 座区创建流程重构总结
- ✅ 创建 `PHASE6_4_BUGFIX.md` - 座区颜色显示 Bug 修复
- ✅ 创建 `DOCS_INDEX.md` - 文档索引（本文件）

### 未来计划
- ⏳ 创建 `ARCHITECTURE.md` - 整体架构设计
- ⏳ 创建 `API_REFERENCE.md` - API 接口文档
- ⏳ 创建 `TESTING_GUIDE.md` - 测试指南

---

## 🎯 推荐阅读路径

### 路径 1：快速上手（适合新成员）

```
1. QUICK_REFERENCE.md（5 分钟）
   ↓ 了解核心原则和检查清单
2. DESIGN_PRINCIPLES.md（20 分钟）
   ↓ 深入理解设计理念
3. PHASE6_4_REFACTOR_SUMMARY.md（10 分钟）
   ↓ 通过案例学习
4. 开始开发 ✅
```

**总时长：35 分钟**

---

### 路径 2：深度学习（适合技术深挖）

```
1. DESIGN_PRINCIPLES.md（完整阅读）
   ↓ 理解设计理念和思维方式
2. PHASE6_4_REFACTOR_SUMMARY.md
   ↓ 学习重构案例
3. PHASE6_4_BUGFIX.md
   ↓ 学习技术细节
4. types.simplified.ts + constants.ts
   ↓ 熟悉代码结构
5. canvas.utils.ts
   ↓ 理解渲染逻辑
6. 开始开发 ✅
```

**总时长：1-2 小时**

---

### 路径 3：问题排查（适合 Bug 修复）

```
1. QUICK_REFERENCE.md（快速回顾原则）
   ↓
2. 定位问题所在的功能模块
   ↓
3. 查看对应的阶段文档（如 PHASE6_4_XXX.md）
   ↓
4. 参考 DESIGN_PRINCIPLES.md 的检查清单
   ↓
5. 修复 Bug + 创建 Bugfix 文档 ✅
```

---

## 💡 使用建议

### 开发新功能时

1. **开发前：** 阅读 `QUICK_REFERENCE.md`，回答"开发前三问"
2. **开发中：** 对照 `DESIGN_PRINCIPLES.md` 的检查清单
3. **开发后：** 创建阶段文档，记录设计决策

### Code Review 时

1. 打开 `QUICK_REFERENCE.md`，检查是否符合三大原则
2. 对照"开发检查清单"，逐项验证
3. 发现问题时，引用具体的设计原则条款

### 遇到疑问时

1. 先看 `QUICK_REFERENCE.md`，90% 的问题都能找到答案
2. 如果需要更详细的说明，再看 `DESIGN_PRINCIPLES.md`
3. 如果是历史问题，查看对应的阶段文档或 Bugfix 文档

---

## 🙋 常见问题

### Q1：为什么座区不能单独创建？

**A：** 见 `DESIGN_PRINCIPLES.md` - 第 2 节"座区是标签，不是容器"

### Q2：如何判断一个实体是"容器"还是"标签"？

**A：** 见 `DESIGN_PRINCIPLES.md` - "正确的思考方式" → "开发前三问"

### Q3：开发前应该检查哪些内容？

**A：** 见 `QUICK_REFERENCE.md` - "开发检查清单"

### Q4：有没有真实的案例可以参考？

**A：** 见 `PHASE6_4_REFACTOR_SUMMARY.md` - 座区创建流程重构案例

---

## 📞 反馈与改进

**发现文档问题？**
- 提 Issue 或直接修改文档
- 在团队会议上讨论

**有更好的建议？**
- 更新 `DESIGN_PRINCIPLES.md`
- 在本文档记录更新日志
- 通知团队成员

**发现新的思维误区？**
- 添加到 `DESIGN_PRINCIPLES.md` 的"常见思维误区"
- 更新 `QUICK_REFERENCE.md` 的"三大思维陷阱"
- 分享给团队学习

---

**文档维护责任：** 开发团队全体成员  
**文档状态：** ✅ 活跃维护  
**最后更新：** 2025-12-17
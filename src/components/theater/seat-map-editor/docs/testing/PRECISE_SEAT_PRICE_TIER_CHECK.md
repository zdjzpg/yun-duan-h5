# 🔍 精确座位模式 - 票档配置实现检查报告

**检查时间：** 2025-12-17  
**检查对象：** 精确座位模式场馆的演出-票档配置  
**检查结果：** ⚠️ **当前实现与按座区数量模式相同，不符合 PRD v1.1 要求**

---

## ❓ 用户问题

> 检查代码，当前精准座位模式场馆的演出-票档配置的实现和按座区数量场馆的票档配置一样是吗？

---

## ✅ 检查结论

**是的，当前实现完全一样。**

### **现状**

对于 `zone_capacity`（按座区数量）和 `precise_seat`（精确座位）两种模式，票档配置的实现**完全相同**：

```typescript
// /components/theater/show-form/PriceTiersStep.tsx

// 1. 获取场馆座区
const fetchVenueZones = async (venueId: string) => {
  const venue = response.data.data;
  
  // ⚠️ zone_capacity 和 precise_seat 使用相同逻辑
  if (venue.capacityType === 'zone_capacity' || venue.capacityType === 'precise_seat') {
    setZoneOptions(
      venue.zones?.map((zone) => ({
        label: zone.name,
        value: zone.id,
      })) || []
    );
  }
};

// 2. 票档表单 - 关联座区
{
  title: '关联座区',
  dataIndex: 'zoneIds',  // ⚠️ 都是通过 zoneIds 关联座区
  render: () => (
    <Form.Item name={[field.name, 'zoneIds']}>
      <Select
        mode="multiple"  // ⚠️ 多选座区
        options={zoneOptions}
      />
    </Form.Item>
  ),
}
```

---

## 📋 PRD 要求 vs 当前实现

### **按座区数量模式（zone_capacity）**

#### **PRD 要求（v1.1 第 2.2 节）：**
- ✅ 只按座区分容量，不要求 seat map
- ✅ 票档配置：选择座区 + 票档/价格 + 张数
- ✅ 用户选：座区 + 票档 + 张数
- ✅ 不记录 seat 级信息

#### **当前实现：**
```typescript
// 票档数据结构
{
  name: "内场票",
  price: 380,
  zoneIds: ["zone-004"],  // ✅ 关联座区
  color: "#FF6B6B"
}
```

**结论：** ✅ **符合 PRD 要求**

---

### **精确座位模式（precise_seat）**

#### **PRD 要求（v1.1 第 4 章）：**

##### **4.1 售卖模式字段（新增）**

> 在演出 Show 对象中新增字段：`sales_mode`，仅当该演出绑定的场馆为"精确座位"时生效。
> 
> - 枚举值：
>   - **ZONE_TICKET（区票，按座区售卖，不选座）**
>   - **SEAT_TICKET（精确选座）**

##### **4.3 座位与票档的关联**

> 在"演出 → 票档与价格"配置步骤中，**增加座位图操作区**：
> 
> 1. 选择某个票档；
> 2. **打开座位图**（可切换楼层）；
> 3. 通过以下方式选择 **seat** 并分配给该票档：
>    - **选中座区：将整个座区全部分配给当前票档；**
>    - **在座区内框选/点选部分座位：实现同区内不同价位的混排。**
> 4. 确认后，该票档与这些 **seat** 形成映射关系。

##### **4.4 座位颜色展示优先级（演出视角）**

> 在"演出座位图视图"中，seat 的颜色优先级如下：
> 1. 若 seat 已分配票档 → 使用 **票档颜色**；
> 2. 若 seat 未分配票档 → 回退显示 **座区颜色**；

#### **当前实现：**

```typescript
// ⚠️ 没有 sales_mode 字段
// ⚠️ 没有座位图操作区
// ⚠️ 没有座位级别的映射

// 票档数据结构（和按座区数量模式完全一样）
{
  name: "VIP 席",
  price: 680,
  zoneIds: ["zone-001"],  // ❌ 只关联座区，不关联座位
  color: "#FFD700"
}
```

**结论：** ❌ **不符合 PRD v1.1 第 4 章要求**

---

## 🔍 详细对比

### **1. 数据结构对比**

| 项目 | 按座区数量模式 | 精确座位模式（PRD 要求） | 当前实现 |
|------|--------------|----------------------|---------|
| **票档字段** | `zoneIds` | ~~`zoneIds`~~（不应该有） | ❌ `zoneIds`（错误） |
| **映射表** | 无 | ✅ `show_seat_prices`（seat_id → price_tier_id） | ❌ 无 |
| **售卖模式** | 无 | ✅ `sales_mode`（ZONE_TICKET / SEAT_TICKET） | ❌ 无 |

---

### **2. 配置界面对比**

| 项目 | 按座区数量模式 | 精确座位模式（PRD 要求） | 当前实现 |
|------|--------------|----------------------|---------|
| **配置方式** | 选择座区（多选下拉框） | ✅ **打开座位图，点选座位** | ❌ 选择座区（多选下拉框） |
| **座位图** | 无 | ✅ 有（可切换楼层） | ❌ 无 |
| **选择粒度** | 座区级别 | ✅ **座位级别**（可按座区批量，可框选部分） | ❌ 座区级别 |
| **同区混价** | 不支持 | ✅ **支持**（同一座区内不同座位不同价格） | ❌ 不支持 |

---

### **3. 业务逻辑对比**

#### **按座区数量模式：**

```
票档配置
   ↓
选择座区（A区、B区、C区）
   ↓
保存票档配置
   {
     name: "内场票",
     price: 380,
     zoneIds: ["zone-004"]  // ✅ 关联座区
   }
   ↓
售卖时
   ↓
用户选择：座区 + 张数
   ↓
系统不分配具体座位（因为没有座位数据）
```

**结论：** ✅ 符合 PRD

---

#### **精确座位模式（PRD 要求）：**

```
票档配置
   ↓
打开座位图
   ↓
方式 1：点击座区 → 将整个座区的所有座位分配给该票档
方式 2：框选部分座位 → 只将选中的座位分配给该票档
   ↓
生成映射关系
   show_seat_prices 表：
   [
     { seat_id: "seat-001", price_tier_id: "tier-001" },
     { seat_id: "seat-002", price_tier_id: "tier-001" },
     { seat_id: "seat-101", price_tier_id: "tier-002" },  // 同一座区内不同价格
     ...
   ]
   ↓
售卖时（根据 sales_mode）
   ↓
ZONE_TICKET（区票）：用户选座区，系统在该票档对应的座位中分配
SEAT_TICKET（精确选座）：用户直接在座位图上点选座位
```

**结论：** ✅ 这是正确的实现

---

#### **精确座位模式（当前实现）：**

```
票档配置
   ↓
选择座区（下拉框多选）
   ↓
保存票档配置
   {
     name: "VIP 席",
     price: 680,
     zoneIds: ["zone-001"]  // ❌ 只关联座区，和按座区数量模式一样
   }
   ↓
售卖时
   ↓
❌ 无法实现座位级别的分配
❌ 无法实现同区内不同价格
❌ 无法实现精确选座
```

**结论：** ❌ 不符合 PRD

---

## 📊 PRD 符合性评分

| 功能 | PRD 要求 | 当前实现 | 符合度 |
|------|---------|---------|--------|
| **按座区数量模式** | 选择座区，票档关联座区 | ✅ 选择座区，票档关联座区 | ✅ 100% |
| **精确座位模式 - 售卖模式字段** | `sales_mode` 字段 | ❌ 无 | ❌ 0% |
| **精确座位模式 - 座位图操作** | 打开座位图，选择座位 | ❌ 无 | ❌ 0% |
| **精确座位模式 - 座位-票档映射** | `show_seat_prices` 表 | ❌ 无 | ❌ 0% |
| **精确座位模式 - 同区混价** | 支持 | ❌ 不支持 | ❌ 0% |

**总体符合度（精确座位模式）：** ❌ **0%**

---

## 🎯 问题根源

### **为什么当前实现相同？**

因为当前的实现是**按座区数量模式的简化版本**，还没有实现演出管理模块的核心功能。

根据之前的分析，演出管理模块包含 4 个核心功能：

1. **功能 1：座位-票档映射创建（3-4h）** ← **这个功能还未实现**
2. 功能 2：演出级座位状态管理（3-4h）
3. 功能 3：锁座/解锁功能（3-4h）
4. 功能 4：座位结构锁定功能（1-2h）

当前的票档配置只是一个**临时实现**，用于：
- 让演出表单可以正常提交
- 让按座区数量模式的演出可以正常配置
- 为后续开发提供基础框架

---

## 📝 正确的实现方案

### **方案 1：区分两种模式的票档配置界面**

```typescript
// /components/theater/show-form/PriceTiersStep.tsx

export function PriceTiersStep({ form }: PriceTiersStepProps) {
  const [venue, setVenue] = useState<Venue | null>(null);

  useEffect(() => {
    const venueId = form.getFieldValue(['basicInfo', 'venueId']);
    if (venueId) {
      fetchVenueDetail(venueId);
    }
  }, []);

  // 根据场馆类型渲染不同的票档配置界面
  return (
    <div>
      {venue?.capacityType === 'zone_capacity' && (
        <ZoneCapacityPriceTiers form={form} venue={venue} />
      )}
      
      {venue?.capacityType === 'precise_seat' && (
        <PreciseSeatPriceTiers form={form} venue={venue} />
      )}
      
      {venue?.capacityType === 'free_seating' && (
        <FreeSeatPriceTiers form={form} />
      )}
    </div>
  );
}
```

---

### **方案 2：按座区数量模式票档配置（保持现有实现）**

```typescript
// /components/theater/show-form/ZoneCapacityPriceTiers.tsx

export function ZoneCapacityPriceTiers({ form, venue }: Props) {
  return (
    <Form.List name="priceTiers">
      {(fields, { add, remove }) => (
        <Table
          dataSource={fields}
          columns={[
            { title: '票档名称', dataIndex: 'name' },
            { title: '票面价', dataIndex: 'price' },
            {
              title: '关联座区',  // ✅ 座区多选
              dataIndex: 'zoneIds',
              render: (_, field) => (
                <Form.Item name={[field.name, 'zoneIds']}>
                  <Select mode="multiple" options={zoneOptions} />
                </Form.Item>
              ),
            },
            { title: '操作', render: () => <Button>删除</Button> }
          ]}
        />
      )}
    </Form.List>
  );
}
```

---

### **方案 3：精确座位模式票档配置（需要新开发）**

```typescript
// /components/theater/show-form/PreciseSeatPriceTiers.tsx

export function PreciseSeatPriceTiers({ form, venue }: Props) {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [seatMapModalOpen, setSeatMapModalOpen] = useState(false);

  return (
    <div>
      {/* 1. 售卖模式选择 */}
      <Form.Item
        label="售卖模式"
        name="salesMode"
        rules={[{ required: true, message: '请选择售卖模式' }]}
      >
        <Radio.Group>
          <Radio value="ZONE_TICKET">区票（按座区售卖，系统分配座位）</Radio>
          <Radio value="SEAT_TICKET">精确选座（用户选具体座位）</Radio>
        </Radio.Group>
      </Form.Item>

      {/* 2. 票档列表 */}
      <Form.List name="priceTiers">
        {(fields, { add, remove }) => (
          <Table
            dataSource={fields}
            columns={[
              { title: '票档名称', dataIndex: 'name' },
              { title: '票面价', dataIndex: 'price' },
              {
                title: '已分配座位',  // ✅ 显示已分配的座位数量
                render: (_, field) => {
                  const seatCount = getSeatCountForTier(field.name);
                  return <span>{seatCount} 个座位</span>;
                },
              },
              {
                title: '操作',
                render: (_, field) => (
                  <Space>
                    {/* ✅ 打开座位图分配座位 */}
                    <Button
                      type="link"
                      onClick={() => {
                        setSelectedTier(field.name);
                        setSeatMapModalOpen(true);
                      }}
                    >
                      分配座位
                    </Button>
                    <Button type="link" onClick={() => remove(field.name)}>
                      删除
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Form.List>

      {/* 3. 座位图分配弹窗 */}
      <SeatPriceMappingModal
        open={seatMapModalOpen}
        onClose={() => setSeatMapModalOpen(false)}
        venue={venue}
        selectedTier={selectedTier}
        onConfirm={(seatIds) => {
          // 保存座位-票档映射关系
          saveSeatPriceMapping(selectedTier, seatIds);
        }}
      />
    </div>
  );
}
```

---

### **方案 4：座位-票档映射弹窗（核心组件）**

```typescript
// /components/theater/show-form/SeatPriceMappingModal.tsx

export function SeatPriceMappingModal({ open, venue, selectedTier, onConfirm }: Props) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [currentFloor, setCurrentFloor] = useState<string>(venue.floors[0].id);

  return (
    <Modal
      title="分配座位到票档"
      open={open}
      width={1200}
      onOk={() => onConfirm(selectedSeats)}
    >
      {/* 楼层切换 */}
      <Tabs activeKey={currentFloor} onChange={setCurrentFloor}>
        {venue.floors.map(floor => (
          <Tabs.TabPane key={floor.id} tab={floor.name}>
            {/* 座位图画布 */}
            <SeatMapCanvas
              floor={floor}
              seats={venue.seats.filter(s => s.floorId === floor.id)}
              zones={venue.zones.filter(z => z.floorId === floor.id)}
              selectedSeats={selectedSeats}
              onSeatClick={(seatId) => toggleSeatSelection(seatId)}
              onZoneClick={(zoneId) => selectAllSeatsInZone(zoneId)}
              onAreaSelect={(seatIds) => addSeatsToSelection(seatIds)}
            />
          </Tabs.TabPane>
        ))}
      </Tabs>

      {/* 操作提示 */}
      <Alert
        message="操作提示"
        description={
          <ul>
            <li>点击座区：将整个座区的所有座位分配给该票档</li>
            <li>点击单个座位：选中/取消选中该座位</li>
            <li>框选区域：批量选中区域内的座位</li>
          </ul>
        }
        type="info"
      />

      {/* 已选座位统计 */}
      <div>
        已选择 {selectedSeats.length} 个座位
      </div>
    </Modal>
  );
}
```

---

## 📅 开发计划

### **功能 1：座位-票档映射创建（3-4h）**

#### **任务清单：**

- [ ] **1.1 数据模型调整（0.5h）**
  - [ ] 在 `Show` 类型中新增 `salesMode` 字段
  - [ ] 创建 `ShowSeatPrice` 类型（座位-票档映射表）
  - [ ] 修改 API 类型定义

- [ ] **1.2 票档配置组件拆分（1h）**
  - [ ] 创建 `ZoneCapacityPriceTiers.tsx`（保持现有逻辑）
  - [ ] 创建 `PreciseSeatPriceTiers.tsx`（新增）
  - [ ] 修改 `PriceTiersStep.tsx`（根据场馆类型渲染不同组件）

- [ ] **1.3 座位-票档映射弹窗（2h）**
  - [ ] 创建 `SeatPriceMappingModal.tsx`
  - [ ] 座位图画布组件（复用场馆层座位图编辑器）
  - [ ] 座位选择逻辑（单选、框选、按座区选择）
  - [ ] 映射关系保存

- [ ] **1.4 API 接口（0.5h）**
  - [ ] `POST /api/shows/{showId}/seat-price-mapping` - 保存映射关系

**预计工时：** 3-4 小时

---

## ✅ 总结

### **用户问题答案：**

**✅ 是的，当前精准座位模式场馆的演出-票档配置的实现和按座区数量场馆的票档配置是一样的。**

### **原因：**

当前的实现只是**临时实现**，用于支持按座区数量模式的演出配置。精确座位模式的演出级功能（包括座位-票档映射）还未开发。

### **不符合 PRD 的具体表现：**

| 项目 | PRD 要求 | 当前实现 | 符合度 |
|------|---------|---------|--------|
| 售卖模式字段 | ✅ `sales_mode` | ❌ 无 | 0% |
| 座位图操作 | ✅ 打开座位图选择座位 | ❌ 只能选择座区 | 0% |
| 座位-票档映射 | ✅ `show_seat_prices` 表 | ❌ 只有 `zoneIds` | 0% |
| 同区混价 | ✅ 支持 | ❌ 不支持 | 0% |

### **解决方案：**

需要开发**演出管理模块 - 功能 1：座位-票档映射创建（3-4h）**，包括：

1. 区分按座区数量和精确座位两种模式的票档配置界面
2. 为精确座位模式新增座位图操作弹窗
3. 实现座位-票档映射关系（`show_seat_prices` 表）
4. 支持三种选择方式：点击座区、点击座位、框选区域

### **下一步：**

✅ **确认后，立即开始开发"功能 1：座位-票档映射创建"** 🚀

---

**检查完成时间：** 2025-12-17  
**检查人：** AI Assistant  
**检查结论：** ⚠️ **当前实现与按座区数量模式相同，需要开发演出管理模块功能才能符合 PRD**

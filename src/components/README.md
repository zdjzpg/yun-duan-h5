# 自封装组件说明

## 使用约定
- 所有 `Y*` 组件均在 `src/main.ts` 通过 `app.component` 全局注册，可在任意 `.vue` 文件中直接使用。
- 业务中涉及开关、日期、日期区间、上传等场景时，务必优先使用自封装组件，避免直接引用 Ant Design Vue 原生组件导致交互和样式不一致。

## 基础组件
- **YSwitch**（`src/components/YSwitch.vue`）：双段开关，支持 `v-model:checked`、禁用、自定义文案与旧版 `item` 用法，提供 `change`、`update:item` 等事件。

- **YUpload**（`src/components/YUpload.vue`）：封装 `a-upload` picture-card 模式，自定义 `itemRender` 以 `object-fit: cover` 填充 80×80 卡片，并仅保留右上角删除按钮。
- **YUploadDraggable**（`src/components/YUploadDraggable.vue`）：在 `YUpload` 基础上集成 `vuedraggable`，允许拖拽排序，上传按钮始终占据最后一格。
- **TableColumnSetting**（`src/components/table/TableColumnSetting.vue`）+ `useTableColumnSetting`：统一的表格列自定义弹窗与 Hook，负责列显隐、强制列、默认隐藏与 `localStorage` 持久化，示例见 `src/views/Demo/TableColumnSettingDemo.vue`。

## 剧场领域组件
- **VenueLockAlert**：`src/components/theater/VenueLockAlert.vue`，用于提示场馆是否被锁定、锁定原因以及允许/禁止的操作，可触发复制场馆弹窗。
- **CopyVenueModal**：`src/components/theater/CopyVenueModal.vue`，负责输入新场馆名称、选择是否复制座位数据并触发 `/theater/venues/copy` 接口。
- **Seat Map Editor**：位于 `src/components/theater/seat-map-editor/`，提供座位图绘制、拖拽、批量编辑等高级功能，依赖 `src/types/theater.ts` 中的座位/楼层模型。



## 共性注意事项
- 日期组件统一使用 `dayjs` 类型（`Dayjs` 或 `null`），不要混用原生 `Date`。
- 局部样式建议写在 `src/styles/common.less` 并使用特定命名空间（例如 `#YunDuanH5`），避免影响第三方组件默认样式。
- 新增组件或调整 Props/事件后，应同步更新本文档与 `docs/COMPONENTS.md`，确保团队成员能及时了解规范。

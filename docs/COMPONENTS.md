# 自封装组件说明（YSwitch  / YUpload / YUploadDraggable）

本文档说明当前项目中自封装的通用组件的用途与用法：

- `YSwitch`：启用/禁用双段开关
- `YUpload`：图片填满卡片、右上角删除按钮的上传组件
- `YUploadDraggable`：在 `YUpload` 基础上增加拖拽排序能力的上传组件
- `TableColumnSetting` + `useTableColumnSetting`：表格列自定义弹窗及其配套 Hook

所有组件均已在 `src/main.ts` 中通过 `app.component` 全局注册，可在任意 `.vue` 文件中直接使用。

## 使用约定（重要）

- 业务代码中，如需开关组件，请优先使用自封装的 `YSwitch`，不要直接使用 Ant Design Vue 的 `a-switch`。
- 业务代码中，如需图片上传组件，请优先使用 `YUpload` / `YUploadDraggable`，不要直接使用 `a-upload`。

> 目的：统一交互与视觉样式，避免重复封装；后续新增页面如有相同功能，请直接复用以上组件。

---

## YSwitch

**文件位置**

- 组件文件：`src/components/YSwitch.vue`
- 全局注册名：`YSwitch`

**典型用法**

```vue
<script setup lang="ts">
import { ref } from 'vue'

const enabled = ref(false)
</script>

<template>
  <YSwitch v-model:checked="enabled" />
</template>
```

**Props**

| 名称               | 类型      | 默认值 | 说明                                                                                          |
| ------------------ | --------- | ------ | --------------------------------------------------------------------------------------------- |
| `v-model:checked`  | `boolean` | `false`| 当前是否启用（推荐用法）                                                                      |
| `disabled`         | `boolean` | `false`| 是否禁用                                                                                      |
| `activeText`       | `string`  | `启用` | 选中状态左侧文案                                                                              |
| `inactiveText`     | `string`  | `禁用` | 未选中状态右侧文案                                                                            |
| `item`             | `object`  | `{}`   | 兼容旧用法：其中可包含 `value/label/required/disabled/activeText/inactiveText/settingTip/errorMsg` 等 |

**事件**

| 事件名             | 参数                 | 说明                                  |
| ------------------ | -------------------- | ------------------------------------- |
| `update:checked`   | `(checked: boolean)` | `v-model:checked` 对应的更新事件      |
| `change`           | `(checked: boolean)` | 新用法：仅基于 `checked` 的变更回调   |
| `update:item`      | `(item: object)`     | 旧用法：整条 `item` 更新              |
| `changeAndNotify`  | `(item: object)`     | 旧用法：变更并通知外层表单/配置模块   |

---

---

## YUpload

**文件位置**

- 组件文件：`src/components/YUpload.vue`
- 全局注册名：`YUpload`

**用途与特点**

- 基于 `a-upload` 封装，`list-type="picture-card"`。
- 重写 `itemRender`，图片以 `object-fit: cover` 的方式填满 80×80 的图片区域，超出部分自动裁剪。
- 预览列表中每张图片右上角只有一个 `X` 删除按钮，不显示 antd 默认的预览/删除图标。

**典型用法**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { UploadFile } from 'ant-design-vue'

const files = ref<UploadFile[]>([])
</script>

<template>
  <YUpload v-model:fileList="files" action="/upload.do" :max-count="5" />
</template>
```

**Props**

| 名称               | 类型                 | 默认值                                           | 说明                                                   |
| ------------------ | -------------------- | ------------------------------------------------ | ------------------------------------------------------ |
| `v-model:fileList` | `UploadFile[]`       | `[]`                                             | 当前文件列表                                           |
| `disabled`         | `boolean`            | `false`                                          | 是否禁用上传                                           |
| `max-count`        | `number`             | `Infinity`                                       | 最多上传文件数量                                       |
| `show-upload-list` | `boolean \| object`  | `{ showPreviewIcon: false, showRemoveIcon: false }` | 是否显示 antd 自带列表；可传 `false` 完全关闭          |
| 其它               | -                    | -                                                | 通过 `v-bind="$attrs"` 透传给内部 `a-upload`（如 `action` 等） |

**事件**

| 事件名             | 参数                    | 说明                               |
| ------------------ | ----------------------- | ---------------------------------- |
| `update:fileList`  | `(files: UploadFile[])` | `v-model:fileList` 对应的更新事件 |
| `change`           | `(info: unknown)`       | 对应 antd `a-upload` 的 `change` 事件 |

---

## YUploadDraggable

**文件位置**

- 组件文件：`src/components/YUploadDraggable.vue`
- 全局注册名：`YUploadDraggable`

**用途与特点**

- 在 `YUpload` 的基础上增加已上传图片的 **拖拽排序** 能力，内部使用 `vuedraggable`。
- `YUploadDraggable` 只负责展示与排序，真正的上传逻辑仍由内部的 `YUpload` 处理。
- 上传按钮会作为一个卡片出现在已上传图片后面，始终占据“最后一格”，并与图片一起自动换行。
- 支持在第一张图片卡片左上角展示“封面”标记，用于在视觉上区分封面图（可配置文案）。

**典型用法**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { UploadFile } from 'ant-design-vue'

const files = ref<UploadFile[]>([])
</script>

<template>
  <YUploadDraggable v-model:fileList="files" action="/upload.do" :max-count="5" />
</template>
```

**Props**

| 名称               | 类型           | 默认值      | 说明                                                                 |
| ------------------ | -------------- | ----------- | -------------------------------------------------------------------- |
| `v-model:fileList` | `UploadFile[]` | `[]`        | 当前文件列表（顺序会随拖拽实时更新）                                 |
| `disabled`         | `boolean`      | `false`     | 是否禁用拖拽与上传                                                   |
| `max-count`        | `number`       | `Infinity`  | 最多上传文件数量，达到上限后“+”按钮自动隐藏                           |
| `show-cover-badge` | `boolean`      | `false`     | 是否在第一张图片卡片左上角展示“封面”标记                             |
| `cover-badge-text` | `string`       | `封面`      | 封面标记文字内容                                                     |
| 其它               | -              | -           | 其它属性（如 `action`）透传给内部 `YUpload` / `a-upload`             |

**行为说明**

- 当还没有已完成（`status === 'done'`）的文件时，内部仅使用 `YUpload` 进行上传展示，此时行为与单独使用 `YUpload` 一致。
- 拖拽已上传图片可以调整顺序，外层拿到的 `fileList` 顺序会同步变化。
- 新上传的图片会按 antd 上传顺序追加到列表中，“+ 上传”按钮始终出现在最后一格。

---

## TableColumnSetting + useTableColumnSetting

**文件位置**

- 组件文件：`src/components/table/TableColumnSetting.vue`
- Hook：`src/hooks/useTableColumnSetting.ts`
- 示例页：`/demo/table-column-setting`

**能力概览**

- `useTableColumnSetting` 封装列可见性的勾选、默认隐藏列、强制显示列与 `localStorage` 的持久化逻辑，可直接复用现有 antd `columns` 配置。
- `TableColumnSetting` 以表格式弹窗展示所有可配置列，提供勾选、重置、保存动作，复用后可以保持多个列表一致的交互体验。

**典型用法**

```vue
<script setup lang="ts">
import { useTableColumnSetting, type ColumnSettingColumn } from '@/hooks/useTableColumnSetting'
import TableColumnSetting from '@/components/table/TableColumnSetting.vue'

const columns: ColumnSettingColumn[] = [
  { title: '序号', key: '__index__', enableSetting: false, width: 72 },
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '备注', dataIndex: 'remark', key: 'remark', defaultHidden: true },
]

const {
  visibleColumns,
  columnSettingItems,
  checkedKeys,
  updateCheckedKeys,
  resetColumns,
} = useTableColumnSetting({ columns, storageKey: 'member-table-columns' })
</script>

<template>
  <a-table :columns="visibleColumns" :data-source="list">
    <template #headerCell="{ column }">
      <template v-if="column.key === '__index__'">
        序号
        <TableColumnSetting
          :columns="columnSettingItems"
          :checked-keys="checkedKeys"
          @confirm="updateCheckedKeys"
          @reset="resetColumns"
        />
      </template>
    </template>
  </a-table>
</template>
```

**注意事项**

- 每张表请使用唯一的 `storageKey`，避免不同表格互相覆盖勾选结果。
- 当可配置列数量为奇数时组件会自动补齐占位列，确保弹窗左右对齐，无需手工调整。
- 若需要修改弹窗样式，可局部覆盖 `table-column-setting__...` 类名实现风格定制。

---

## 统一注意事项

- 日期相关组件依赖 `dayjs` 作为日期类型，请在使用时按项目约定统一使用 `Dayjs` 类型而不是原生 `Date`。
- 项目入口 `src/main.ts` 中已通过 `ConfigProvider` 使用 `zh_CN` locale，日期组件均默认显示为中文。
- 如需局部覆盖样式，建议在 `src/styles/common.less` 中添加规则，优先使用特定作用域（例如 `#YunDuanH5` 下的选择器）避免影响第三方组件的默认行为。

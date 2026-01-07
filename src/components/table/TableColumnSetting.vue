<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { SettingOutlined } from '@ant-design/icons-vue'
import type { ColumnSettingItem } from '@/hooks/useTableColumnSetting'

const props = withDefaults(
  defineProps<{
    columns: ColumnSettingItem[]
    checkedKeys: string[]
    title?: string
  }>(),
  {
    title: '自定义表格字段',
  },
)

const emit = defineEmits<{
  (e: 'confirm', value: string[]): void
}>()

type DisplayColumnItem = ColumnSettingItem & { isPlaceholder?: boolean }

const open = ref(false)
const localCheckedKeys = ref<string[]>([])
const displayColumns = computed<DisplayColumnItem[]>(() => {
  const source = props.columns.map((item: ColumnSettingItem): DisplayColumnItem => ({ ...item }))
  if (source.length % 2 !== 0) {
    source.push({
      key: `__placeholder__-${source.length}`,
      label: '',
      disabled: true,
      defaultHidden: true,
      isPlaceholder: true,
    } as DisplayColumnItem)
  }
  return source
})

watch(
  () => props.checkedKeys,
  (value) => {
    localCheckedKeys.value = [...value]
  },
  { immediate: true },
)

const handleSave = () => {
  emit('confirm', localCheckedKeys.value)
  open.value = false
}

</script>

<template>
  <a-popover
    v-model:open="open"
    trigger="click"
    placement="bottomLeft"
    overlay-class-name="table-column-setting-popover"
  >
    <template #content>
      <div class="table-column-setting">
        <div class="table-column-setting__title">{{ props.title }}</div>
        <a-checkbox-group v-model:value="localCheckedKeys" class="table-column-setting__group">
          <div class="table-column-setting__grid">
            <div
              v-for="item in displayColumns"
              :key="item.key"
              class="table-column-setting__grid-item"
              :class="{ 'table-column-setting__grid-item--placeholder': item.isPlaceholder }"
            >
              <template v-if="!item.isPlaceholder">
                <a-checkbox :value="item.key" :disabled="item.disabled">
                  {{ item.label }}
                </a-checkbox>
              </template>
            </div>
          </div>
        </a-checkbox-group>
        <div class="table-column-setting__footer">
          <a-space>
            <a-button @click="open = false">关闭</a-button>
            <a-button type="primary" @click="handleSave">保存</a-button>
          </a-space>
        </div>
      </div>
    </template>

    <slot>
      <a-button type="text" size="small" class="table-column-setting__trigger">
        <SettingOutlined />
      </a-button>
    </slot>
  </a-popover>
</template>

<style scoped>
.table-column-setting__trigger {
  padding: 0;
  height: auto;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #1d2129;
}

.table-column-setting {
  width: 323px;
}

.table-column-setting__title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
}

.table-column-setting__group {
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  max-height: 280px;
  overflow-y: auto;
  width: 100%;
}

.table-column-setting__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-radius: 4px;
  overflow: hidden;
  width: 100%;
}

.table-column-setting__grid-item {
  padding: 10px 16px;
  min-height: 44px;
  display: flex;
  align-items: center;
  border-right: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
}

.table-column-setting__grid-item:nth-of-type(2n) {
  border-right: none;
}

.table-column-setting__grid-item:nth-last-of-type(-n + 2) {
  border-bottom: none;
}

.table-column-setting__grid-item--placeholder {
  background: #fafafa;
}

.table-column-setting__footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 12px;
}
</style>

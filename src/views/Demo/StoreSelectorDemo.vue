<script setup lang="ts">
import { ref, computed } from 'vue'
import StoreSelectorModal from '@/components/store/StoreSelectorModal.vue'

const open = ref(false)
const selectedIds = ref<number[]>([])

const selectedStoreText = computed(() => {
  const count = selectedIds.value.length
  if (!count) return '未选择门店'
  return `已选择 ${count} 家门店`
})
</script>

<template>
  <a-card title="门店选择器 Demo">
    <a-space direction="vertical" style="width: 100%">
      <div>
        <span style="margin-right: 8px">销售门店：</span>
        <a-typography-link @click="open = true">
          {{ selectedStoreText }}
        </a-typography-link>
      </div>

      <div>
        <a-typography-text type="secondary">
          当前选中门店 ID：{{ selectedIds.length ? selectedIds.join(', ') : '暂无' }}
        </a-typography-text>
      </div>
    </a-space>

    <StoreSelectorModal v-model:open="open" v-model:selectedIds="selectedIds" />
  </a-card>
</template>

<style scoped>
:deep(.ant-card) {
  max-width: 720px;
}
</style>


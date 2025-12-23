<template>
  <a-card :title="props.title">
    <a-space direction="vertical">
      <a-progress type="circle" :percent="(props.count / 20) * 100" />
      <a-typography-text>当前计数: {{ props.count }}</a-typography-text>
      <a-button-group>
        <a-button @click="updateCount(-1)">减少</a-button>
        <a-button type="primary" @click="updateCount(1)">增加</a-button>
        <a-button danger @click="resetCount">重置</a-button>
      </a-button-group>
    </a-space>
  </a-card>
</template>

<script setup lang="ts">
// 定义Props类型
interface Props {
  title: string
  count: number
}
const props = defineProps<Props>()

// 定义Emit类型
const emit = defineEmits<{
  (e: 'update-count', value: number): void
}>()

const updateCount = (delta: number) => {
  const newValue = props.count + delta
  emit('update-count', newValue)
}
const resetCount = () => {
  emit('update-count', 0)
}
</script>

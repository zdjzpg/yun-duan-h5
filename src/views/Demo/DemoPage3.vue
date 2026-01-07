<!-- 父组件 Parent.vue组件通信 -->
<template>
  <a-card title="父组件">
    <!-- 传递数据和事件给使用AntD的子组件 -->
    <Child :title="parentTitle" :count="parentCount" @update-count="handleUpdate" />
    <a-divider />
    <div>父组件的计算是：{{ parentCount }}</div>
  </a-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Child from './DemoPage3Child.vue'
import message from 'ant-design-vue/es/message'
const parentTitle = ref('来自父组件的标题')
const parentCount = ref(10)

const handleUpdate = (newCount: number) => {
  parentCount.value = newCount
  // 可以结合AntD的消息提示
  message.success(`计数已更新为：${newCount}`)
}
</script>

<!-- 常用Vue指令 -->
<template>
  <div style="width: 50%; margin: 100px auto">
    <a-space direction="vertical">
      <!-- 条件渲染：使用 AntD 的 Skeleton 和 Alert -->
      <a-skeleton v-if="loading" active />
      <div v-else-if="type === 'A'">
        <a-alert message="A类型内容" type="info" />
      </div>
      <a-alert v-else message="其他内容" type="warning" />

      <!-- 列表渲染：v-for  key必备-->
      <div>
        <div v-for="value in items" :key="value.id">
          {{ value.name }}
        </div>
      </div>

      <!-- 双向绑定：与 4.2 节示例类似，这里展示另一种 -->
      <a-input-search
        v-model:value="searchText"
        placeholder="输入搜索内容"
        enter-button="搜索"
        @search="onSearch"
      />

      <!-- 事件绑定：AntD 组件事件通常使用 @事件名 @clear @change @blur -->
      <a-space>
        <a-button type="primary" @click="handleClick('primary')">主要按钮</a-button>
        <a-button danger @click="handleClick('danger')">危险按钮</a-button>
        <a-button @mouseenter="handleMouseEnter">鼠标移入</a-button>
      </a-space>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const loading = ref(false)
const type = ref('A')
const searchText = ref('')
// 定义列表数据项类型
interface ListItem {
  id: number
  name: string
}
const items = ref<ListItem[]>([
  { id: 1, name: '项目1' },
  { id: 2, name: '项目2' },
])

const handleClick = (btnType: string) => {
  console.log(`点击了${btnType}按钮`)
}
const handleMouseEnter = () => {
  console.log('鼠标移入')
}
const onSearch = (value: string) => {
  console.log('搜索值：', value)
}
</script>

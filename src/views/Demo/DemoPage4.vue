<!-- 在组件中使用路由 -->
<template>
  <div>
    <a-button @click="goTo">前往demo1</a-button>
    <a-button @click="goTo3">前往demo3并带参数</a-button>
  </div>
</template>
<script setup lang="ts">
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 编程式导航
const goTo = () => {
  router.push({ name: 'demo' })
}
//带参数
const goTo3 = () => {
  router.push({
    path: 'demo3',
    query: {
      id: 1,
    },
  })
}

// 监听路由变化
onBeforeRouteUpdate((to, from) => {
  debugger
  // 路由更新前的逻辑
})
</script>

<!-- 在组件中使用Store -->
<template>
  <div>
    <h2>用户列表 ({{ userCount }})</h2>
    <div v-if="loading">加载中...</div>
    <ul v-else>
      <li v-for="user in users" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
    <button @click="refreshUsers">刷新</button>
  </div>
</template>
<script setup lang="ts">
import { useUserStore } from '@/stores/test'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()

// 使用storeToRefs保持响应式
const { users, loading, userCount } = storeToRefs(userStore)

// 直接解构actions
const { fetchUsers, addUser } = userStore

// 调用action
const refreshUsers = async () => {
  await fetchUsers()
}

// 也可以在setup外使用store
// import { useUserStore } from '@/stores/user'
// const userStore = useUserStore()
</script>

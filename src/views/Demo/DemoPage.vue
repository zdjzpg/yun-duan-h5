<template>
  <!-- 使用 AntD 的布局、标题和按钮组件 -->
  <a-card :title="title">
    <a-space direction="vertical" style="width: 100%">
      <!-- 计数示例 -->
      <a-typography-text>计数: {{ count }}</a-typography-text>
      <a-button type="primary" @click="increment"> 增加 ({{ count }}) </a-button>
      <a-alert
        v-if="doubleCount > 4"
        type="warning"
        :message="`当前双倍计数为: ${doubleCount}`"
      />

      <!-- 登录接口示例：三个输入框 + 调用 signIn -->
      <a-typography-text strong>signIn 接口示例</a-typography-text>
      <a-input
        v-model:value="loginForm.account"
        placeholder="account（门店账号）"
        style="max-width: 300px"
      />
      <a-input
        v-model:value="loginForm.cashierJobNumber"
        placeholder="cashierJobNumber（收银工号）"
        style="max-width: 300px"
      />
      <a-input
        v-model:value="loginForm.password"
        type="password"
        placeholder="password（登录密码）"
        style="max-width: 300px"
      />
      <a-button type="primary" :loading="loginLoading" @click="handleSignIn">
        调用 signIn 接口
      </a-button>

      <a-alert
        v-if="loginResult"
        type="success"
        :message="`登录成功，收银员：${loginResult.CashierName}`"
      />
    </a-space>
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { signIn, type SignInResult } from '@/api/account'

const title = ref<string>('示例')

// 1. 计数相关示例
const count = ref<number>(0)
const doubleCount = computed<number>(() => count.value * 2)

const increment = (): void => {
  count.value++
}

// 2. 登录表单相关状态
const loginForm = ref({
  account: '',
  cashierJobNumber: '',
  password: '',
})
const loginLoading = ref(false)
const loginResult = ref<SignInResult | null>(null)

const handleSignIn = async () => {
  if (!loginForm.value.account || !loginForm.value.cashierJobNumber || !loginForm.value.password) {
    // 简单校验：三个字段都要有值
    return
  }
  loginLoading.value = true
  loginResult.value = null
  try {
    const res = await signIn({
      account: loginForm.value.account,
      cashierJobNumber: loginForm.value.cashierJobNumber,
      password: loginForm.value.password,
    })
    loginResult.value = res
  } catch (error) {
    // 错误信息已经在 request.ts 里通过 message.error 提示，这里不再额外处理
    console.error('调用 signIn 失败:', error)
  } finally {
    loginLoading.value = false
  }
}

// 生命周期 + 监听示例
onMounted(() => {
  console.log('DemoPage 已挂载')
})

watch(count, (newVal, oldVal) => {
  console.log(`count 变化: ${oldVal} -> ${newVal}`)
})
</script>

<style scoped>
:deep(.ant-card) {
  max-width: 500px;
}
</style>


import { createRouter, createWebHistory } from 'vue-router'
import { demoRoutes } from './modules/demo'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/test',
    },
    ...demoRoutes,
  ],
})
// 路由守卫
router.beforeEach((to, from) => {
  // 设置页面标题
  const title = (to.meta.title as string) || 'Vue3 App'
  document.title = title
  debugger
  // 权限验证
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    return { name: 'Login' }
  }

  if (to.meta.guestOnly && token) {
    return { name: 'Home' }
  }
})
export default router

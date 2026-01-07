import { createRouter, createWebHistory } from 'vue-router'
import { theaterVenueRoutes } from './modules/theaterVenues'
import { theaterShowRoutes } from './modules/theaterShows'
import { demoRoutes } from './modules/demo'
import TableColumnSettingDemo from '@/views/Demo/TableColumnSettingDemo.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/demo/table-column-setting',
    },
    {
      path: '/demo/table-column-setting',
      name: 'TableColumnSettingDemo',
      component: TableColumnSettingDemo,
      meta: { title: '表头自定义 Demo' },
    },
    ...demoRoutes,
    ...theaterVenueRoutes,
    ...theaterShowRoutes,
  ],
})

router.beforeEach((to) => {
  const title = (to.meta.title as string) || 'Vue3 App'
  document.title = title

  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    return { name: 'Login' }
  }

  if (to.meta.guestOnly && token) {
    return { name: 'Home' }
  }
})
export default router

import { createRouter, createWebHashHistory } from 'vue-router'
import { theaterVenueRoutes } from './modules/theater/theaterVenues'
import { theaterShowRoutes } from './modules/theater/theaterShows'
import { demoRoutes } from './modules/demo'
import { tmsTicketingSaleRoutes } from './modules/tmsTicketingSale'
import HomeView from '@/views/HomeView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: HomeView,
      meta: { title: '云端 · 模块入口' },
    },
    ...demoRoutes,
    ...theaterVenueRoutes,
    ...theaterShowRoutes,
    ...tmsTicketingSaleRoutes,
  ],
})

router.beforeEach(async (to) => {
  const title = (to.meta.title as string) || 'Vue3 App'
  document.title = title

  const authStore = useAuthStore()
  await authStore.ensureLogin()

  const token = authStore.token

  if (to.meta.requiresAuth && !token) {
    return { name: 'Login' }
  }

  if (to.meta.guestOnly && token) {
    return { name: 'Home' }
  }
})
export default router

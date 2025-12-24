import { createRouter, createWebHistory } from 'vue-router'
import { demoRoutes } from './modules/demo'
import { theaterVenueRoutes } from './modules/theaterVenues'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/test',
    },
    ...demoRoutes,
    ...theaterVenueRoutes,
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

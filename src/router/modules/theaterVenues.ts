import type { RouteRecordRaw } from 'vue-router'

import VenueList from '@/views/Theater/Venues/VenueList.vue'
import VenueCreate from '@/views/Theater/Venues/VenueCreate.vue'
import VenueEdit from '@/views/Theater/Venues/VenueEdit.vue'

export const theaterVenueRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard/theater/venues',
    name: 'TheaterVenueList',
    component: VenueList,
    meta: { title: '场馆管理' },
  },
  {
    path: '/dashboard/theater/venues/new',
    name: 'TheaterVenueCreate',
    component: VenueCreate,
    meta: { title: '新建场馆' },
  },
  {
    path: '/dashboard/theater/venues/:id',
    name: 'TheaterVenueEdit',
    component: VenueEdit,
    meta: { title: '编辑场馆' },
  },
]


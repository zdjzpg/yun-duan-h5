import type { RouteRecordRaw } from 'vue-router'

import ShowList from '@/views/Theater/Shows/ShowList.vue'
import ShowCreate from '@/views/Theater/Shows/ShowCreate.vue'
import ShowEdit from '@/views/Theater/Shows/ShowEdit.vue'

export const theaterShowRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard/theater/shows',
    name: 'TheaterShowList',
    component: ShowList,
    meta: { title: '演出管理' },
  },
  {
    path: '/dashboard/theater/shows/new',
    name: 'TheaterShowCreate',
    component: ShowCreate,
    meta: { title: '新建演出' },
  },
  {
    path: '/dashboard/theater/shows/:id',
    name: 'TheaterShowEdit',
    component: ShowEdit,
    meta: { title: '编辑演出' },
  },
]


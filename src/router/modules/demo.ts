import type { RouteRecordRaw } from 'vue-router'

import Test from '@/views/Demo/index.vue'
import Demo from '@/views/Demo/DemoPage.vue'
import Demo2 from '@/views/Demo/DemoPage2.vue'
import Demo3 from '@/views/Demo/DemoPage3.vue'
import Demo4 from '@/views/Demo/DemoPage4.vue'
import Demo5 from '@/views/Demo/DemoPage5.vue'
import Demo6 from '@/views/Demo/DemoPage6.vue'
import StoreSelectorDemo from '@/views/Demo/StoreSelectorDemo.vue'

export const demoRoutes: RouteRecordRaw[] = [
  {
    path: '/test',
    name: 'test',
    component: Test,
  },
  {
    path: '/demo',
    name: 'demo',
    component: Demo,
  },
  {
    path: '/demo2',
    name: 'demo2',
    component: Demo2,
  },
  {
    path: '/demo3',
    name: 'demo3',
    component: Demo3,
  },
  {
    path: '/demo4',
    name: 'demo4',
    component: Demo4,
  },
  {
    path: '/demo5',
    name: 'demo5',
    component: Demo5,
  },
  {
    path: '/demo6',
    name: 'demo6',
    component: Demo6,
  },
  {
    path: '/demo/store-selector',
    name: 'StoreSelectorDemo',
    component: StoreSelectorDemo,
  },
]

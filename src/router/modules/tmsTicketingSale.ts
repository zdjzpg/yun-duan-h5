import type { RouteRecordRaw } from 'vue-router'

import TicketingSale from '@/views/TMS/TicketingSale/index.vue'

export const tmsTicketingSaleRoutes: RouteRecordRaw[] = [
  {
    path: '/tms/ticketing-sale',
    name: 'TmsTicketingSale',
    component: TicketingSale,
    meta: { title: '售票' },
  },
]

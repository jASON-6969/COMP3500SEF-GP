import { createRouter, createWebHistory } from 'vue-router'
import SalesRecord from '../views/SalesRecord.vue'
import Inventory from '../views/Inventory.vue'
import Selling from '../views/Selling.vue'

const routes = [
  {
    path: '/',
    redirect: '/selling'
  },
  {
    path: '/sales-record',
    name: 'SalesRecord',
    component: SalesRecord
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: Inventory
  },
  {
    path: '/selling',
    name: 'Selling',
    component: Selling
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

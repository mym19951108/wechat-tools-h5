import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './pages/Home.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/baby-name', component: () => import('./pages/baby-name/BabyName.vue') },
  { path: '/english-name', component: () => import('./pages/english-name/EnglishName.vue') },
  { path: '/nickname', component: () => import('./pages/nickname/Nickname.vue') },
  { path: '/mortgage', component: () => import('./pages/mortgage/Mortgage.vue') },
  { path: '/date-calc', component: () => import('./pages/date-calc/DateCalc.vue') },
  { path: '/:pathMatch(.*)', redirect: '/' }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})

import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './pages/Home.vue'
import BabyName from './pages/baby-name/BabyName.vue'
import EnglishName from './pages/english-name/EnglishName.vue'
import Nickname from './pages/nickname/Nickname.vue'
import Mortgage from './pages/mortgage/Mortgage.vue'
import DateCalc from './pages/date-calc/DateCalc.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/baby-name', component: BabyName },
  { path: '/english-name', component: EnglishName },
  { path: '/nickname', component: Nickname },
  { path: '/mortgage', component: Mortgage },
  { path: '/date-calc', component: DateCalc }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})

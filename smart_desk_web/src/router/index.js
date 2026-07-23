import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Students from '../views/Students.vue'
import StudyData from '../views/StudyData.vue'
import Devices from '../views/Devices.vue'
import FlowerPot from '../views/FlowerPot.vue'
import FishTank from '../views/FishTank.vue'
import Car from '../views/Car.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: Dashboard },
    { path: '/students', component: Students },
    { path: '/students/:id', name: 'StudentDetail', component: () => import('../views/StudentDetail.vue') },
    { path: '/study-data', component: StudyData },
    { path: '/devices', component: Devices },
    { path: '/car', component: Car },
    { path: '/flower-pot', component: FlowerPot },
    { path: '/fish-tank', component: FishTank }
  ]
})

export default router

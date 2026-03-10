import { createRouter, createWebHistory } from 'vue-router'
// 导入4个页面（确保文件路径正确）
import Dashboard from '../views/Dashboard.vue'
import Students from '../views/Students.vue'
import StudyData from '../views/StudyData.vue'
import Devices from '../views/Devices.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: Dashboard }, // 默认显示数据看板
    { path: '/students', component: Students },
    { path: '/students/:id', name: 'StudentDetail', component: () => import('../views/StudentDetail.vue') }, // 学生详情页
    { path: '/study-data', component: StudyData },
    { path: '/devices', component: Devices }
  ]
})

export default router
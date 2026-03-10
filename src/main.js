import { createApp } from 'vue'
import App from './App.vue'
// 1. 引入路由（如果提示找不到router，先看步骤三）
import router from './router'
// 2. 引入Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 3. 引入Element Plus图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// 注册所有Element Plus图标（解决图标找不到的问题）
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 关键：挂载路由和Element Plus
app.use(router)
app.use(ElementPlus)

app.mount('#app')
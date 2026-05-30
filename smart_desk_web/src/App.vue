<template>
  <el-container class="app-container">
    <el-aside width="220px" class="app-aside">
      <div class="aside-header">
        <span class="aside-logo">📚</span>
        <span class="aside-title">智能学习桌</span>
      </div>
      <el-menu
        :default-active="route.path"
        class="aside-menu"
        background-color="#1e2a3a"
        text-color="#8ba0b8"
        active-text-color="#fff"
        router
      >
        <el-menu-item index="/">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据统计</span>
        </el-menu-item>
        <el-menu-item index="/students">
          <el-icon><User /></el-icon>
          <span>学生管理</span>
        </el-menu-item>
        <el-menu-item index="/study-data">
          <el-icon><Notebook /></el-icon>
          <span>学习数据</span>
        </el-menu-item>
        <el-menu-item index="/devices">
          <el-icon><Monitor /></el-icon>
          <span>设备管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="app-header">
        <el-breadcrumb separator="›">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item v-if="route.path !== '/'">{{ pageTitle }}</el-breadcrumb-item>
        </el-breadcrumb>
        <div class="header-right">
          <el-dropdown>
            <span class="user-dropdown">
              <el-avatar :size="32" style="background: #667eea;">管</el-avatar>
              <span class="user-name">管理员</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <el-icon><Setting /></el-icon>个人设置
                </el-dropdown-item>
                <el-dropdown-item divided>
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  DataAnalysis, User, Notebook, Monitor,
  Setting, SwitchButton
} from '@element-plus/icons-vue'

const route = useRoute()

const pageTitle = computed(() => {
  const map = {
    '/': '数据统计',
    '/students': '学生管理',
    '/study-data': '学习数据',
    '/devices': '设备管理'
  }
  const matched = route.matched.find(r => map[r.path])
  return matched ? map[matched.path] : ''
})
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
#app { height: 100%; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #c1c7cd; border-radius: 3px; }
</style>

<style scoped>
.app-container {
  height: 100vh;
}

.app-aside {
  background: #1e2a3a;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.aside-header {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}

.aside-logo {
  font-size: 24px;
}

.aside-title {
  color: #fff;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 1px;
}

.aside-menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
}

.aside-menu .el-menu-item {
  margin: 4px 8px;
  border-radius: 8px;
  width: auto;
}

.aside-menu .el-menu-item.is-active {
  background: linear-gradient(135deg, #667eea, #764ba2) !important;
}

.aside-menu .el-menu-item:hover {
  background-color: rgba(255,255,255,0.08) !important;
}

.app-header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e8eaed;
  padding: 0 24px;
  height: 60px;
  flex-shrink: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-name {
  color: #5f6368;
  font-size: 14px;
}

.app-main {
  background: #f0f2f5;
  padding: 0;
  overflow-y: auto;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>

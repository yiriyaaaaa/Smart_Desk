<template>
  <el-container style="height: 100vh;">
    <!-- 侧边栏 -->
    <el-aside width="200px" style="background-color: #2e3b4e;">
      <el-menu
        default-active="1"
        class="el-menu-vertical-demo"
        background-color="#2e3b4e"
        text-color="#fff"
        active-text-color="#ffd04b"
        router
      >
        <el-menu-item index="/">
          <el-icon><Menu /></el-icon>
          <template #title>数据统计</template>
        </el-menu-item>
        <el-menu-item index="/students">
          <el-icon><User /></el-icon>
          <template #title>学生管理</template>
        </el-menu-item>
        <el-menu-item index="/study-data">
          <el-icon><Document /></el-icon>
          <template #title>学习数据</template>
        </el-menu-item>
        <el-menu-item index="/devices">
          <el-icon><Monitor /></el-icon>
          <template #title>设备管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <el-header style="text-align: right; font-size: 12px">
        <el-dropdown>
          <i class="el-icon-setting" style="margin-right: 15px"></i>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>查看</el-dropdown-item>
              <el-dropdown-item>新增</el-dropdown-item>
              <el-dropdown-item>删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <span>管理员</span>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { Menu, User, Document, Monitor } from '@element-plus/icons-vue'
</script>

<style scoped>
.el-header {
  background-color: #fff;
  color: #333;
  line-height: 60px;
  border-bottom: 1px solid #e6e6e6;
}

.el-aside {
  color: #333;
}
</style>
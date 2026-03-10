<template>
  <div class="dashboard-container">
    <!-- 页面标题区域 -->
    <div class="page-header-wrapper">
      <span class="header-title">数据统计中心</span>
    </div>

    <!-- 加载状态 -->
    <el-loading 
      v-if="loading" 
      fullscreen 
      lock 
      text="正在加载数据..."
      background="rgba(255, 255, 255, 0.8)"
    ></el-loading>

    <!-- 统计卡片区域 -->
    <el-row :gutter="24" class="stats-row" v-if="!loading">
      <!-- 学生总人数卡片 -->
      <el-col :xs="12" :sm="8" :md="6" :lg="4" :xl="4" class="stat-col">
        <el-card class="stat-card student-card">
          <div class="card-header">
            <i class="el-icon-user-solid card-icon"></i>
            <div class="card-title">学生总人数</div>
          </div>
          <div class="card-value">{{ studentCount }}</div>
          <div class="card-desc">全校注册学生总数</div>
        </el-card>
      </el-col>

      <!-- 在线设备数卡片 -->
      <el-col :xs="12" :sm="8" :md="6" :lg="4" :xl="4" class="stat-col">
        <el-card class="stat-card online-card">
          <div class="card-header">
            <i class="el-icon-video-play card-icon"></i>
            <div class="card-title">在线设备数</div>
          </div>
          <div class="card-value">{{ onlineDeviceNum }}</div>
          <div class="card-desc">当前在线的设备数量</div>
        </el-card>
      </el-col>

      <!-- 离线设备数卡片 -->
      <el-col :xs="12" :sm="8" :md="6" :lg="4" :xl="4" class="stat-col">
        <el-card class="stat-card offline-card">
          <div class="card-header">
            <i class="el-icon-video-pause card-icon"></i>
            <div class="card-title">离线设备数</div>
          </div>
          <div class="card-value">{{ offlineDeviceNum }}</div>
          <div class="card-desc">当前离线的设备数量</div>
        </el-card>
      </el-col>

      <!-- 设备总数卡片 -->
      <el-col :xs="12" :sm="8" :md="6" :lg="4" :xl="4" class="stat-col">
        <el-card class="stat-card total-card">
          <div class="card-header">
            <i class="el-icon-laptop card-icon"></i>
            <div class="card-title">设备总数</div>
          </div>
          <div class="card-value">{{ totalDeviceNum }}</div>
          <div class="card-desc">已注册的设备总数量</div>
        </el-card>
      </el-col>

      <!-- 在线率卡片 -->
      <el-col :xs="12" :sm="8" :md="6" :lg="4" :xl="4" class="stat-col">
        <el-card class="stat-card rate-card">
          <div class="card-header">
            <i class="el-icon-percentage card-icon"></i>
            <div class="card-title">设备在线率</div>
          </div>
          <div class="card-value">{{ onlineRate }}</div>
          <div class="card-desc">在线设备占总设备比例</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 提示信息区域 -->
    <div class="tips-wrapper">
      <el-alert 
        title="📌 操作提示" 
        description="请在学生管理页面点击“查看详情”进入学生详情，查看当日学习时间和当前坐姿状态。" 
        type="info" 
        show-icon 
        :closable="false"
        class="info-alert"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import request from '../utils/request'

// 加载状态
const loading = ref(false)

// 统计数据
const studentCount = ref(0)
const onlineDeviceNum = ref(0)
const totalDeviceNum = ref(0)
const offlineDeviceNum = computed(() => totalDeviceNum.value - onlineDeviceNum.value)
const onlineRate = computed(() => {
  if (!totalDeviceNum.value) return '0.0%'
  return ((onlineDeviceNum.value / totalDeviceNum.value) * 100).toFixed(1) + '%'
})

// 未使用的字段（保留）
const dayStudyTime = ref(0)
const weekStudyTime = ref(0)
const postureStatus = ref('未知')

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    // 获取学生总数
    const userRes = await request.get('/api/users', { params: { page: 1, size: 1 } })
    if (userRes.code === 200) {
      studentCount.value = userRes.data.total || 0
    }

    // 获取学习时间（保留）
    const studyRes = await request.get('/api/study-time', { params: { userId: 1001 } })
    if (studyRes.code === 200) {
      dayStudyTime.value = studyRes.data.dayStudyTime
      weekStudyTime.value = studyRes.data.weekStudyTime
    }

    // 获取坐姿状态（保留）
    const postureRes = await request.get('/api/posture', { params: { userId: 1001 } })
    if (postureRes.code === 200) {
      postureStatus.value = postureRes.data.status === 'normal' ? '正确' : '错误';
    }

    // 获取设备数据
    const deviceRes = await request.get('/api/devices')
    if (deviceRes.code === 200) {
      totalDeviceNum.value = deviceRes.data.total || deviceRes.data.list.length
      onlineDeviceNum.value = deviceRes.data.list.filter(item => item.status === 'online').length
    }
  } catch (err) {
    console.error('数据加载失败：', err)
    import('element-plus').then(({ ElMessage }) => {
      ElMessage.error('数据加载失败，请检查后端是否启动')
    })
  } finally {
    loading.value = false
  }
}

// 页面挂载时加载数据
onMounted(async () => {
  await fetchData()
})
</script>

<style scoped>
/* 全局容器 */
.dashboard-container {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

/* 页面标题区域 */
.page-header-wrapper {
  margin-bottom: 32px;
}

.page-header {
  --el-page-header-text-color: #1989fa;
  --el-page-header-font-size: 20px;
  font-weight: 600;
}

/* 统计卡片行 */
.stats-row {
  margin-bottom: 32px;
}

/* 卡片列 */
.stat-col {
  margin-bottom: 24px;
}

/* 统计卡片通用样式 */
.stat-card {
  height: 180px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
  border: none;
  overflow: hidden;
  position: relative;
  background: #fff;
}

.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 卡片内部布局 */
.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 16px;
  padding-top: 20px;
}

.card-icon {
  font-size: 20px;
  margin-right: 8px;
  color: #409eff;
}

.card-title {
  font-size: 15px;
  color: #606266;
  font-weight: 500;
}

.card-value {
  font-size: 36px;
  font-weight: 700;
  color: #1f2937;
  padding: 0 16px;
  line-height: 1.2;
  margin-bottom: 8px;
}

.card-desc {
  font-size: 13px;
  color: #909399;
  padding: 0 16px;
}

/* 不同卡片的主题色 */
.student-card .card-icon {
  color: #409eff;
}

.online-card .card-icon {
  color: #67c23a;
}

.offline-card .card-icon {
  color: #e6a23c;
}

.total-card .card-icon {
  color: #909399;
}

.rate-card .card-icon {
  color: #f56c6c;
}

/* 提示信息区域 */
.tips-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.info-alert {
  border-radius: 8px;
  background: #f0f9ff;
  border: 1px solid #e6f7ff;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }

  .card-value {
    font-size: 28px;
  }

  .page-header-wrapper {
    margin-bottom: 24px;
  }
}

@media (max-width: 480px) {
  .card-value {
    font-size: 24px;
  }

  .stat-card {
    height: 160px;
  }
}
</style>

<style>
/* 隐藏滚动条但保留滚动功能（可选） */
::-webkit-scrollbar {
  display: none;
}
-ms-overflow-style: none;
scrollbar-width: none;
</style>
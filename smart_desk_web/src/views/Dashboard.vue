<template>
  <div class="dashboard-container" v-loading="loading" element-loading-text="正在加载数据...">
    <div class="page-header">
      <div>
        <h2 class="page-title">📊 数据统计中心</h2>
        <p class="page-desc">智能学习桌管理系统总览</p>
      </div>
      <el-button type="primary" @click="fetchData">
        <el-icon><Refresh /></el-icon> 刷新数据
      </el-button>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="8" :md="6" :lg="4" v-for="stat in stats" :key="stat.label">
        <el-card shadow="hover" class="stat-card" :style="`border-top: 3px solid ${stat.color}`">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-value">{{ stat.value }}</div>
            </div>
            <el-icon :size="44" :color="stat.color"><component :is="stat.icon" /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :lg="16">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>📈 学习时长趋势</span>
              <el-tag type="success" size="small">近7日</el-tag>
            </div>
          </template>
          <div ref="studyChartRef" style="height: 320px"></div>
          <div v-if="studyChartEmpty" class="chart-empty">
            <el-empty description="暂无足够数据生成趋势图" />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>🖥️ 设备状态分布</span>
            </div>
          </template>
          <div ref="deviceChartRef" style="height: 320px"></div>
          <div v-if="deviceChartEmpty" class="chart-empty">
            <el-empty description="暂无设备数据" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="recent-card">
      <template #header>
        <div class="chart-header">
          <span>📋 最近学习记录</span>
          <el-button text type="primary" size="small" @click="$router.push('/study-data')">
            查看全部
          </el-button>
        </div>
      </template>
      <el-table :data="recentSessions" stripe empty-text="暂无学习记录" v-loading="sessionsLoading">
        <el-table-column prop="recordId" label="记录ID" width="100" />
        <el-table-column prop="userName" label="学生" width="120" />
        <el-table-column prop="startTime" label="开始时间" />
        <el-table-column prop="endTime" label="结束时间" />
        <el-table-column prop="duration" label="时长(分钟)" width="120" align="center">
          <template #default="{ row }">
            <el-tag>{{ row.duration }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import * as echarts from 'echarts'
import { Refresh } from '@element-plus/icons-vue'

const router = useRouter()

const loading = ref(false)
const sessionsLoading = ref(false)

const studyChartRef = ref(null)
const deviceChartRef = ref(null)
let studyChart = null
let deviceChart = null
const studyChartEmpty = ref(false)
const deviceChartEmpty = ref(false)

const studentCount = ref(0)
const onlineDeviceNum = ref(0)
const totalDeviceNum = ref(0)
const offlineDeviceNum = ref(0)
const onlineRate = ref('0.0%')

const recentSessions = ref([])

const stats = reactive([])

const updateStats = () => {
  const total = totalDeviceNum.value
  const online = onlineDeviceNum.value
  const offline = Math.max(total - online, 0)
  const rate = total ? ((online / total) * 100).toFixed(1) + '%' : '0.0%'

  Object.assign(stats, [
    { label: '学生总人数', value: studentCount.value, icon: 'User', color: '#409eff' },
    { label: '在线设备数', value: online, icon: 'VideoPlay', color: '#67c23a' },
    { label: '离线设备数', value: offline, icon: 'VideoPause', color: '#e6a23c' },
    { label: '设备总数', value: total, icon: 'Monitor', color: '#909399' },
    { label: '设备在线率', value: rate, icon: 'TrendCharts', color: '#f56c6c' },
  ])
}

const fetchData = async () => {
  loading.value = true
  try {
    const [userRes, deviceRes] = await Promise.all([
      request.get('/api/users', { params: { page: 1, size: 1 } }),
      request.get('/api/devices'),
    ])
    if (userRes.code === 200) studentCount.value = userRes.data.total || 0
    if (deviceRes.code === 200 && deviceRes.data) {
      totalDeviceNum.value = deviceRes.data.total || deviceRes.data.list.length
      onlineDeviceNum.value = deviceRes.data.list.filter(i => i.status === 'online').length
    }
  } catch (e) {
    console.error('Dashboard load error:', e)
  } finally {
    loading.value = false
    updateStats()
  }
}

const initStudyChart = async () => {
  try {
    const res = await request.get('/api/study-sessions', { params: { page: 1, size: 200 } })
    if (res.code === 200 && res.data && res.data.length) {
      const dateMap = {}
      res.data.forEach(s => {
        const date = s.startTime.split(' ')[0]
        dateMap[date] = (dateMap[date] || 0) + s.duration
      })
      const dates = Object.keys(dateMap).sort()
      const durations = dates.map(d => dateMap[d])
      if (!dates.length) { studyChartEmpty.value = true; return }

      await nextTick()
      studyChart = echarts.init(studyChartRef.value)
      studyChart.setOption({
        tooltip: { trigger: 'axis', formatter: '{b}<br/>学习时长: {c} 分钟' },
        grid: { left: 50, right: 20, top: 30, bottom: 30 },
        xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#dcdfe6' } } },
        yAxis: { type: 'value', name: '分钟', nameTextStyle: { color: '#909399' }, splitLine: { lineStyle: { color: '#f0f2f5' } } },
        series: [{
          type: 'line', smooth: true, data: durations,
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(102,126,234,0.3)' }, { offset: 1, color: 'rgba(102,126,234,0.02)' }] } },
          lineStyle: { color: '#667eea', width: 3 },
          itemStyle: { color: '#667eea' },
        }],
      })
      window.addEventListener('resize', () => studyChart?.resize())
    } else {
      studyChartEmpty.value = true
    }
  } catch (e) {
    studyChartEmpty.value = true
    console.error('Study chart error:', e)
  }
}

const initDeviceChart = async () => {
  try {
    const res = await request.get('/api/devices')
    if (res.code === 200 && res.data && res.data.list.length) {
      const list = res.data.list
      const statusCount = { online: 0, offline: 0, error: 0 }
      list.forEach(d => { statusCount[d.status] = (statusCount[d.status] || 0) + 1 })
      const data = Object.entries(statusCount).filter(([, v]) => v > 0)
      if (!data.length) { deviceChartEmpty.value = true; return }

      const colorMap = { online: '#67c23a', offline: '#e6a23c', error: '#f56c6c' }
      const nameMap = { online: '在线', offline: '离线', error: '故障' }

      await nextTick()
      deviceChart = echarts.init(deviceChartRef.value)
      deviceChart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [{
          type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: true,
          label: { show: true, formatter: '{b}\n{d}%' },
          emphasis: { label: { show: true, fontSize: 14 } },
          data: data.map(([k, v]) => ({ name: nameMap[k] || k, value: v, itemStyle: { color: colorMap[k] || '#909399' } })),
        }],
      })
      window.addEventListener('resize', () => deviceChart?.resize())
    } else {
      deviceChartEmpty.value = true
    }
  } catch (e) {
    deviceChartEmpty.value = true
    console.error('Device chart error:', e)
  }
}

const loadRecentSessions = async () => {
  sessionsLoading.value = true
  try {
    const res = await request.get('/api/study-sessions', { params: { page: 1, size: 10 } })
    if (res.code === 200) {
      recentSessions.value = (res.data || []).map(s => ({
        ...s,
        userName: s.userName || `用户${s.userId}`
      }))
    }
  } catch (e) {
    console.error('Recent sessions error:', e)
  } finally {
    sessionsLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchData(), initStudyChart(), initDeviceChart(), loadRecentSessions()])
})

onUnmounted(() => {
  studyChart?.dispose()
  deviceChart?.dispose()
})
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
}

.page-desc {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  margin-bottom: 20px;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
}

.charts-row {
  margin-bottom: 24px;
}

.chart-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 500;
}

.chart-empty {
  margin-top: -320px;
  position: relative;
  z-index: 1;
  pointer-events: none;
}

.recent-card {
  border-radius: 12px;
}
</style>

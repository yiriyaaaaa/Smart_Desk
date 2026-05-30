<template>
  <div class="detail-container" v-loading="loading" element-loading-text="正在加载学生数据...">
    <div class="page-header">
      <el-button text @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2 class="page-title">👤 学生详情</h2>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="6">
        <el-card class="user-card">
          <div class="user-avatar">
            <el-avatar :size="80" style="background: linear-gradient(135deg, #667eea, #764ba2); font-size: 32px;">
              {{ student.name ? student.name[0] : '?' }}
            </el-avatar>
          </div>
          <div class="user-name">{{ student.name || '--' }}</div>
          <div class="user-class">{{ student.class || '--' }}</div>
          <el-divider />
          <div class="info-row">
            <span class="info-label">学生ID</span>
            <span class="info-value">{{ student.id || '--' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">今日学习</span>
            <span class="info-value highlight">{{ dayStudyTime }} 分钟</span>
          </div>
          <div class="info-row">
            <span class="info-label">坐姿状态</span>
            <el-tag :type="postureStatus === '正确' ? 'success' : 'danger'" size="small">
              {{ postureStatus }}
            </el-tag>
          </div>
        </el-card>

        <el-card class="summary-card">
          <template #header>📊 数据概览</template>
          <div class="summary-item">
            <div class="summary-num">{{ totalSessions }}</div>
            <div class="summary-label">学习次数</div>
          </div>
          <el-divider />
          <div class="summary-item">
            <div class="summary-num">{{ totalDuration }}</div>
            <div class="summary-label">总时长(分钟)</div>
          </div>
          <el-divider />
          <div class="summary-item">
            <div class="summary-num">{{ avgDuration }}</div>
            <div class="summary-label">平均时长(分钟)</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="18">
        <el-card class="chart-card">
          <template #header>📈 学习时长趋势</template>
          <div ref="studyChartRef" style="height: 300px"></div>
          <div v-if="studyChartEmpty" class="chart-empty">
            <el-empty description="暂无学习数据" />
          </div>
        </el-card>

        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>📋 学习记录</span>
              <el-tag>{{ totalSessions }} 条</el-tag>
            </div>
          </template>
          <el-table :data="sessions" stripe empty-text="暂无学习记录">
            <el-table-column prop="startTime" label="开始时间" />
            <el-table-column prop="endTime" label="结束时间" />
            <el-table-column prop="duration" label="时长(分钟)" width="130" align="center">
              <template #default="{ row }">
                <el-tag :type="row.duration >= 120 ? 'success' : row.duration >= 60 ? 'warning' : 'info'">
                  {{ row.duration }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-if="totalSessions > pageSize"
            class="pagination"
            :current-page="pageNum"
            :page-size="pageSize"
            layout="prev, pager, next"
            :total="totalSessions"
            @current-change="loadSessions"
            small
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../utils/request'
import * as echarts from 'echarts'
import { ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const studentId = route.params.id

const loading = ref(false)
const student = ref({})
const dayStudyTime = ref(0)
const postureStatus = ref('未知')
const sessions = ref([])
const totalSessions = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const totalDuration = ref(0)
const avgDuration = computed(() => {
  if (!totalSessions.value) return 0
  return Math.round(totalDuration.value / totalSessions.value)
})

const studyChartRef = ref(null)
let studyChart = null
const studyChartEmpty = ref(false)

const goBack = () => router.back()

const loadStudent = async () => {
  try {
    const res = await request.get('/api/users', { params: { page: 1, size: 200 } })
    if (res.code === 200) {
      student.value = res.data.list.find(u => u.id == studentId) || {}
    }
  } catch { console.error('load student failed') }
}

const loadPosture = async () => {
  try {
    const res = await request.get('/api/posture', { params: { userId: studentId } })
    if (res.code === 200) {
      postureStatus.value = res.data.postureStatus === 'normal' ? '正确' : '错误'
    }
  } catch { console.error('load posture failed') }
}

const loadSessions = async (page = 1) => {
  pageNum.value = page
  try {
    const res = await request.get('/api/study-sessions/user', { params: { userId: studentId, page, size: pageSize.value } })
    if (res.code === 200) {
      sessions.value = res.data || []
      totalSessions.value = res.total || 0
      totalDuration.value = sessions.value.reduce((sum, s) => sum + (s.duration || 0), 0)
    }
  } catch { console.error('load sessions failed') }
}

const initStudyChart = async () => {
  try {
    const res = await request.get('/api/study-sessions/user', { params: { userId: studentId, page: 1, size: 500 } })
    if (res.code === 200 && res.data && res.data.length) {
      const dateMap = {}
      res.data.forEach(s => {
        const date = s.startTime.split(' ')[0]
        dateMap[date] = (dateMap[date] || 0) + s.duration
      })
      const dates = Object.keys(dateMap).sort()
      const durations = dates.map(d => dateMap[d])

      if (!dates.length) { studyChartEmpty.value = true; return }
      studyChartEmpty.value = false

      const dayTotal = durations.reduce((a, b) => a + b, 0)
      if (dayTotal) dayStudyTime.value = dayTotal

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
          markLine: { data: [{ type: 'average', name: '平均值' }], label: { formatter: '平均: {c}' } },
        }],
      })
      window.addEventListener('resize', () => studyChart?.resize())
    } else {
      studyChartEmpty.value = true
    }
  } catch (e) {
    studyChartEmpty.value = true
  }
}

onMounted(async () => {
  loading.value = true
  await Promise.all([loadStudent(), loadPosture(), loadSessions(), initStudyChart()])
  loading.value = false
})

onUnmounted(() => studyChart?.dispose())
</script>

<style scoped>
.detail-container {
  padding: 24px;
  min-height: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
}

.user-card {
  border-radius: 12px;
  margin-bottom: 20px;
  text-align: center;
  padding-top: 20px;
}

.user-avatar {
  margin-bottom: 12px;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.user-class {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-label {
  font-size: 14px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.highlight {
  color: #667eea;
  font-weight: 700;
}

.summary-card {
  border-radius: 12px;
  text-align: center;
  margin-bottom: 20px;
}

.summary-item {
  padding: 12px 0;
}

.summary-num {
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
}

.summary-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
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
  margin-top: -300px;
  position: relative;
  z-index: 1;
  pointer-events: none;
}

.pagination {
  margin-top: 16px;
  justify-content: center;
}
</style>

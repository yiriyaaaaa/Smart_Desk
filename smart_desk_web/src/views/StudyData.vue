<template>
  <div class="study-data-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">📖 学习数据</h2>
        <p class="page-desc">查看所有学生的学习记录与趋势</p>
      </div>
    </div>

    <el-card class="chart-card">
      <template #header>
        <div class="chart-header">
          <span>📈 学习时长趋势</span>
          <el-date-picker
            v-model="chartDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            value-format="YYYY-MM-DD"
            style="width: 260px"
            @change="initTrendChart"
          />
        </div>
      </template>
      <div ref="trendChartRef" style="height: 340px"></div>
      <div v-if="trendEmpty" class="chart-empty">
        <el-empty description="暂无数据" />
      </div>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <span>📋 学习记录列表</span>
      </template>

      <div class="toolbar">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 280px"
        />
        <el-select v-model="selectedUser" placeholder="选择学生" clearable style="width: 180px">
          <el-option v-for="u in userList" :key="u.id" :label="u.name" :value="u.id" />
        </el-select>
        <el-button type="primary" @click="fetchRecords">
          <el-icon><Search /></el-icon> 查询
        </el-button>
        <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
      </div>

      <el-table :data="studyRecordList" border stripe v-loading="loading" empty-text="暂无学习记录">
        <el-table-column prop="recordId" label="记录ID" width="100" align="center" />
        <el-table-column prop="userId" label="学生ID" width="100" align="center" />
        <el-table-column prop="userName" label="学生姓名" width="120" />
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
        class="pagination"
        :current-page="pageNum"
        :page-sizes="[10, 20, 50]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import request from '../utils/request'
import * as echarts from 'echarts'
import { Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const trendChartRef = ref(null)
let trendChart = null
const trendEmpty = ref(false)
const chartDateRange = ref([])

const dateRange = ref([])
const selectedUser = ref('')
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const studyRecordList = ref([])
const userList = ref([])
const loading = ref(false)

const fetchUserList = async () => {
  try {
    const res = await request.get('/api/users', { params: { page: 1, size: 200 } })
    if (res.code === 200) userList.value = res.data.list || []
  } catch { console.error('加载用户列表失败') }
}

const fetchRecords = async () => {
  loading.value = true
  try {
    const params = { page: pageNum.value, size: pageSize.value }
    if (selectedUser.value) params.userId = selectedUser.value
    if (dateRange.value.length === 2) {
      params.from = dateRange.value[0]
      params.to = dateRange.value[1]
    }
    const res = await request.get('/api/study-sessions', { params })
    if (res.code === 200) {
      studyRecordList.value = (res.data || []).map(s => ({
        ...s,
        userName: s.userName || `用户${s.userId}`
      }))
      total.value = res.total || 0
    }
  } catch (e) {
    console.error('获取记录失败:', e)
    ElMessage.error('获取记录失败')
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  dateRange.value = []
  selectedUser.value = ''
  pageNum.value = 1
  fetchRecords()
}

const initTrendChart = async () => {
  try {
    const params = { page: 1, size: 500 }
    if (chartDateRange.value.length === 2) {
      params.from = chartDateRange.value[0]
      params.to = chartDateRange.value[1]
    }
    const res = await request.get('/api/study-sessions', { params })
    if (res.code !== 200 || !res.data || !res.data.length) {
      trendEmpty.value = true
      return
    }

    const dateMap = {}
    res.data.forEach(s => {
      const date = s.startTime.split(' ')[0]
      dateMap[date] = (dateMap[date] || 0) + s.duration
    })
    const dates = Object.keys(dateMap).sort()
    const durations = dates.map(d => dateMap[d])
    if (!dates.length) { trendEmpty.value = true; return }
    trendEmpty.value = false

    await nextTick()
    trendChart?.dispose()
    trendChart = echarts.init(trendChartRef.value)
    trendChart.setOption({
      tooltip: { trigger: 'axis', formatter: '{b}<br/>总时长: {c} 分钟' },
      grid: { left: 50, right: 20, top: 30, bottom: 30 },
      xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#dcdfe6' } } },
      yAxis: { type: 'value', name: '分钟', nameTextStyle: { color: '#909399' }, splitLine: { lineStyle: { color: '#f0f2f5' } } },
      series: [{
        type: 'bar', data: durations,
        barWidth: '40%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#667eea' }, { offset: 1, color: '#764ba2' }] }
        },
      }],
    })
    window.addEventListener('resize', () => trendChart?.resize())
  } catch (e) {
    trendEmpty.value = true
    console.error('Trend chart error:', e)
  }
}

const handleSizeChange = (val) => { pageSize.value = val; fetchRecords() }
const handleCurrentChange = (val) => { pageNum.value = val; fetchRecords() }

onMounted(async () => {
  await fetchUserList()
  await Promise.all([fetchRecords(), initTrendChart()])
})

onUnmounted(() => trendChart?.dispose())
</script>

<style scoped>
.study-data-container {
  padding: 24px;
  min-height: 100%;
}

.page-header {
  margin-bottom: 20px;
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
  margin-top: -340px;
  position: relative;
  z-index: 1;
  pointer-events: none;
}

.table-card {
  border-radius: 12px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>

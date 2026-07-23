<template>
  <div class="page-container" v-loading="loading" element-loading-text="正在加载鱼缸数据...">
    <div class="page-header">
      <div>
        <h2 class="page-title">🐠 智能鱼缸</h2>
        <p class="page-desc">实时监测水质数据</p>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card">
          <template #header><span>📊 水温趋势</span></template>
          <div v-if="!chartEmpty" ref="tempChartRef" style="height: 300px"></div>
          <el-empty v-else description="暂无鱼缸数据" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="16">
        <el-card class="table-card">
          <template #header>
            <div class="table-header">
              <span>📋 水质历史</span>
              <el-button size="small" type="primary" @click="fetchHistory"><el-icon><Refresh /></el-icon> 刷新</el-button>
            </div>
          </template>
          <el-table :data="historyList" border stripe v-loading="tableLoading" empty-text="暂无数据" max-height="400">
            <el-table-column label="时间" min-width="150">
              <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
            </el-table-column>
            <el-table-column prop="temperature" label="水温(°C)" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.temperature > 30 || row.temperature < 20 ? 'danger' : 'success'" size="small">{{ row.temperature }}°C</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="ph" label="pH值" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.ph < 6.5 || row.ph > 8.0 ? 'danger' : 'success'" size="small">{{ row.ph }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="turbidityNtu" label="浑浊度(NTU)" width="110" align="center" />
            <el-table-column label="加热棒" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.heaterOn ? 'danger' : 'info'" size="small">{{ row.heaterOn ? '开' : '关' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="警报" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.alertOn ? 'warning' : 'info'" size="small">{{ row.alertOn ? '开' : '关' }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination class="pagination" :current-page="pageNum" :page-sizes="[10,20,50]" :page-size="pageSize" layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="(v)=>{pageSize=v;fetchHistory()}" @current-change="(v)=>{pageNum=v;fetchHistory()}" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header><span>🐠 当前状态</span></template>
          <div v-if="state" class="detail-grid">
            <div class="detail-item">
              <span class="detail-item-label">水温</span>
              <span :style="{ color: state.temperature > 30 || state.temperature < 20 ? '#f56c6c' : '#67c23a', fontWeight: 600 }">{{ state.temperature }}°C</span>
            </div>
            <div class="detail-item">
              <span class="detail-item-label">pH值</span>
              <span :style="{ color: state.ph < 6.5 || state.ph > 8.0 ? '#f56c6c' : '#67c23a', fontWeight: 600 }">{{ state.ph }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-item-label">浑浊度</span>
              <span>{{ state.turbidityNtu }} NTU</span>
            </div>
            <div class="detail-item">
              <span class="detail-item-label">在线状态</span>
              <el-tag :type="state.online ? 'success' : 'danger'" size="small">{{ state.online ? '在线' : '离线' }}</el-tag>
            </div>
            <div class="detail-item">
              <span class="detail-item-label">加热棒</span>
              <el-tag :type="state.heaterOn ? 'danger' : 'info'" size="small">{{ state.heaterOn ? '工作中' : '关闭' }}</el-tag>
            </div>
            <div class="detail-item">
              <span class="detail-item-label">警报灯</span>
              <el-tag :type="state.alertOn ? 'warning' : 'info'" size="small">{{ state.alertOn ? '开启' : '关闭' }}</el-tag>
            </div>
          </div>
          <el-empty v-else description="暂无数据" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><span>🎮 控制</span></template>
          <div class="control-panel">
            <el-button type="primary" @click="sendCommand('feed', { amountG: 1 })">🍕 喂食(1g)</el-button>
            <el-button :type="state?.alertOn ? 'warning' : 'default'" @click="sendCommand('set_alert', { enabled: !state?.alertOn })">
              🔔 {{ state?.alertOn ? '关闭' : '开启' }}警报
            </el-button>
            <el-button @click="sendCommand('set_heater', { targetC: 26, maxMinutes: 30 })">
              🌡️ 加热至26°C
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import request from '../utils/request'
import * as echarts from 'echarts'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const tableLoading = ref(false)
const state = ref(null)
const historyList = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const tempChartRef = ref(null)
let tempChart = null
const chartEmpty = ref(false)
let onResize = null

const formatTime = (t) => t ? new Date(t).toLocaleString() : '--'

const fetchState = async () => {
  try {
    const res = await request.get('/api/fishtank/state', { params: { deviceId: 'smart-fishtank-01' } })
    if (res.code === 200) state.value = res.data
  } catch (e) { state.value = null }
}

const fetchHistory = async () => {
  tableLoading.value = true
  try {
    const res = await request.get('/api/fishtank/history', { params: { deviceId: 'smart-fishtank-01', page: pageNum.value, size: pageSize.value } })
    if (res.code === 200) {
      historyList.value = res.data || []
      total.value = res.total || 0
    }
  } catch (e) { historyList.value = [] }
  finally { tableLoading.value = false }
}

const initChart = async () => {
  loading.value = true; chartEmpty.value = true
  try {
    const res = await request.get('/api/fishtank/history', { params: { deviceId: 'smart-fishtank-01', page: 1, size: 20 } })
    if (res.code === 200 && res.data?.length) {
      chartEmpty.value = false
      await nextTick()
      tempChart = echarts.init(tempChartRef.value)
      const data = res.data.reverse()
      tempChart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: data.map(s => new Date(s.createTime).toLocaleTimeString()), axisLabel: { rotate: 45 } },
        yAxis: { type: 'value', min: 0, max: 40, name: '°C' },
        series: [{ name: '水温', type: 'line', data: data.map(s => s.temperature), smooth: true, lineStyle: { width: 2 }, itemStyle: { color: (p) => p.value > 30 || p.value < 20 ? '#f56c6c' : '#67c23a' } }]
      })
      onResize = () => tempChart?.resize()
      window.addEventListener('resize', onResize)
    }
  } catch (e) { /* ignore */ }
  finally { loading.value = false }
}

const sendCommand = async (command, value) => {
  try {
    const res = await request.post('/api/device/control', { deviceId: 'smart-fishtank-01', command, value })
    if (res.code === 200) ElMessage.success('命令已下发')
  } catch (e) { ElMessage.error('命令下发失败') }
}

onMounted(async () => { await Promise.all([fetchState(), fetchHistory(), initChart()]) })
onUnmounted(() => { if (onResize) window.removeEventListener('resize', onResize); tempChart?.dispose() })
</script>

<style scoped>
.page-container { padding: 24px; min-height: 100%; }
.page-header { margin-bottom: 20px; }
.page-title { font-size: 22px; font-weight: 600; color: #1f2937; }
.page-desc { font-size: 14px; color: #909399; margin-top: 4px; }
.chart-card, .table-card { border-radius: 12px; margin-bottom: 20px; }
.table-header { display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: 500; }
.pagination { margin-top: 20px; justify-content: flex-end; }
.detail-grid { display: flex; flex-direction: column; gap: 16px; }
.detail-item { display: flex; align-items: center; gap: 16px; }
.detail-item-label { width: 80px; font-size: 14px; color: #636e72; font-weight: 500; flex-shrink: 0; }
.control-panel { display: flex; gap: 12px; flex-wrap: wrap; }
</style>

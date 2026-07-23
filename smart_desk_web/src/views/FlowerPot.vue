<template>
  <div class="page-container" v-loading="loading" element-loading-text="正在加载植栽数据...">
    <div class="page-header">
      <div>
        <h2 class="page-title">🪴 智能植栽</h2>
        <p class="page-desc">实时监测环境与土壤数据</p>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card">
          <template #header><span>📊 土壤湿度</span></template>
          <div v-if="!chartEmpty" ref="moistureChartRef" style="height: 300px"></div>
          <el-empty v-else description="暂无植栽数据" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="16">
        <el-card class="table-card">
          <template #header>
            <div class="table-header">
              <span>📋 传感器历史</span>
              <el-button size="small" type="primary" @click="fetchSensors"><el-icon><Refresh /></el-icon> 刷新</el-button>
            </div>
          </template>
          <el-table :data="sensorList" border stripe v-loading="tableLoading" empty-text="暂无数据" @row-click="(row) => currentSensor = row" max-height="400">
            <el-table-column label="时间" min-width="150">
              <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
            </el-table-column>
            <el-table-column prop="soilMoisture" label="土壤湿度(%)" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="row.soilMoisture < 30 ? 'danger' : row.soilMoisture > 80 ? 'warning' : 'success'" size="small">{{ row.soilMoisture }}%</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="temperature" label="温度(°C)" width="90" align="center" />
            <el-table-column prop="humidity" label="湿度(%)" width="90" align="center" />
            <el-table-column prop="lux" label="光照(lux)" width="100" align="center" />
            <el-table-column label="水箱" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.tankLow ? 'danger' : 'success'" size="small">{{ row.tankLow ? '缺水' : '正常' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="水泵" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.pumpOn ? 'primary' : 'info'" size="small">{{ row.pumpOn ? '开' : '关' }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination class="pagination" :current-page="pageNum" :page-sizes="[10,20,50]" :page-size="pageSize" layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="(v)=>{pageSize=v;fetchSensors()}" @current-change="(v)=>{pageNum=v;fetchSensors()}" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header><span>🪴 当前详情 & 控制</span></template>
          <div v-if="currentSensor?.id" class="detail-grid">
            <div class="detail-item">
              <span class="detail-item-label">土壤湿度</span>
              <el-progress :percentage="currentSensor.soilMoisture || 0" :color="currentSensor.soilMoisture < 30 ? '#f56c6c' : '#67c23a'" />
            </div>
            <div class="detail-item">
              <span class="detail-item-label">温度/湿度</span>
              <span>{{ currentSensor.temperature }}°C / {{ currentSensor.humidity }}%</span>
            </div>
            <div class="detail-item">
              <span class="detail-item-label">光照</span>
              <span>{{ currentSensor.lux }} lux</span>
            </div>
            <div class="detail-item">
              <span class="detail-item-label">设备状态</span>
              <el-tag v-if="currentSensor.tankLow" type="danger" size="small">水箱缺水</el-tag>
              <el-tag v-if="currentSensor.pumpOn" type="primary" size="small">水泵运行中</el-tag>
              <el-tag v-if="currentSensor.growLightOn" type="warning" size="small">补光灯开启</el-tag>
              <el-tag v-if="!currentSensor.tankLow && !currentSensor.pumpOn && !currentSensor.growLightOn" type="info" size="small">空闲</el-tag>
            </div>
            <div class="detail-item">
              <span class="detail-item-label">控制</span>
              <el-button size="small" type="primary" @click="sendCommand('water', { seconds: 5 })" :disabled="currentSensor.tankLow">💧 浇水</el-button>
              <el-button size="small" :type="currentSensor.growLightOn ? 'warning' : 'default'" @click="sendCommand('set_grow_light', { enabled: !currentSensor.growLightOn })">
                💡 {{ currentSensor.growLightOn ? '关闭' : '开启' }}补光灯
              </el-button>
              <el-button size="small" @click="sendCommand('set_auto_care', { enabled: true })">🤖 自动养护</el-button>
            </div>
          </div>
          <el-empty v-else description="点击表格行查看详情" />
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
const sensorList = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const currentSensor = ref({})

const moistureChartRef = ref(null)
let moistureChart = null
const chartEmpty = ref(false)
let onResize = null

const formatTime = (t) => t ? new Date(t).toLocaleString() : '--'

const fetchSensors = async () => {
  tableLoading.value = true
  try {
    const res = await request.get('/api/sensors', { params: { userId: 4001, deviceId: 'smart-plant-esp32s3', page: pageNum.value, size: pageSize.value } })
    if (res.code === 200) {
      sensorList.value = res.data || []
      total.value = res.total || 0
      if (sensorList.value.length && !currentSensor.value.id) currentSensor.value = sensorList.value[0]
    }
  } catch (e) { sensorList.value = [] }
  finally { tableLoading.value = false }
}

const initChart = async () => {
  loading.value = true; chartEmpty.value = true
  try {
    const res = await request.get('/api/sensors', { params: { userId: 4001, deviceId: 'smart-plant-esp32s3', page: 1, size: 20 } })
    if (res.code === 200 && res.data?.length) {
      chartEmpty.value = false
      await nextTick()
      moistureChart = echarts.init(moistureChartRef.value)
      const data = res.data.reverse()
      moistureChart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: data.map(s => new Date(s.createTime).toLocaleTimeString()), axisLabel: { rotate: 45 } },
        yAxis: { type: 'value', min: 0, max: 100, name: '%' },
        series: [
          { name: '土壤湿度', type: 'line', data: data.map(s => s.soilMoisture), smooth: true, lineStyle: { width: 2 }, itemStyle: { color: (p) => p.value < 30 ? '#f56c6c' : '#67c23a' } }
        ]
      })
      onResize = () => moistureChart?.resize()
      window.addEventListener('resize', onResize)
    }
  } catch (e) { /* ignore */ }
  finally { loading.value = false }
}

const sendCommand = async (command, value) => {
  try {
    const res = await request.post('/api/device/control', { deviceId: 'smart-plant-esp32s3', command, value })
    if (res.code === 200) ElMessage.success('命令已下发')
  } catch (e) { ElMessage.error('命令下发失败') }
}

onMounted(async () => { await Promise.all([fetchSensors(), initChart()]) })
onUnmounted(() => { if (onResize) window.removeEventListener('resize', onResize); moistureChart?.dispose() })
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
.detail-item-label { width: 100px; font-size: 14px; color: #636e72; font-weight: 500; flex-shrink: 0; }
</style>

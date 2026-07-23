<template>
  <div class="page-container" v-loading="loading" element-loading-text="正在加载车辆数据...">
    <div class="page-header">
      <div>
        <h2 class="page-title">🚗 智能小车</h2>
        <p class="page-desc">实时位姿与远程控制</p>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card">
          <template #header><span>📍 位姿信息</span></template>
          <div v-if="car" class="pose-grid">
            <div class="pose-item">
              <span class="pose-label">X</span>
              <span class="pose-value">{{ car.pose?.x?.toFixed(2) || '--' }} m</span>
            </div>
            <div class="pose-item">
              <span class="pose-label">Y</span>
              <span class="pose-value">{{ car.pose?.y?.toFixed(2) || '--' }} m</span>
            </div>
            <div class="pose-item">
              <span class="pose-label">Yaw</span>
              <span class="pose-value">{{ car.pose?.yaw?.toFixed(2) || '--' }} rad</span>
            </div>
            <div class="pose-item">
              <span class="pose-label">定位质量</span>
              <span class="pose-value">{{ car.localizationQuality != null ? (car.localizationQuality * 100).toFixed(0) + '%' : '--' }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无数据" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="16">
        <el-card class="chart-card">
          <template #header>
            <div class="table-header">
              <span>🚗 车辆信息</span>
              <el-button size="small" type="primary" @click="fetchCar"><el-icon><Refresh /></el-icon> 刷新</el-button>
            </div>
          </template>
          <div v-if="car" class="info-grid">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="设备ID">{{ car.carId }}</el-descriptions-item>
              <el-descriptions-item label="工作状态">
                <el-tag :type="stateType(car.state)" size="small">{{ car.state }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="在线状态">
                <el-tag :type="car.online !== false ? 'success' : 'danger'" size="small">{{ car.online !== false ? '在线' : '离线' }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="最后更新">{{ car.lastUpdateTime ? new Date(car.lastUpdateTime).toLocaleString() : '--' }}</el-descriptions-item>
              <el-descriptions-item label="目标点" v-if="car.goal?.valid">
                ({{ car.goal.x.toFixed(2) }}, {{ car.goal.y.toFixed(2) }})
              </el-descriptions-item>
              <el-descriptions-item label="位姿有效">
                <el-tag :type="car.poseValid ? 'success' : 'warning'" size="small">{{ car.poseValid ? '有效' : '无效' }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
          <el-empty v-else description="暂无车辆数据" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header><span>🎮 控制面板</span></template>
          <div class="control-panel">
            <el-button type="primary" @click="sendCommand('goto', { x: 4, y: 3.5, yaw: 0 })">
              📍 前往坐标
            </el-button>
            <el-button type="danger" @click="sendCommand('stop')">
              ⏹️ 停止
            </el-button>
            <el-button type="warning" @click="sendCommand('pause')">
              ⏸️ 暂停
            </el-button>
            <el-button type="success" @click="sendCommand('resume')">
              ▶️ 恢复
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const car = ref(null)

const stateType = (s) => {
  if (s === 'idle') return 'success'
  if (s === 'legacy_course') return 'primary'
  if (s === 'stopped_remote' || s === 'paused') return 'warning'
  return 'info'
}

const fetchCar = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/car/state', { params: { carId: 'smart-car-01' } })
    if (res.code === 200) car.value = res.data
  } catch (e) {
    car.value = null
  } finally {
    loading.value = false
  }
}

const sendCommand = async (command, value) => {
  try {
    const res = await request.post('/api/device/control', { deviceId: 'smart-car-01', command, value: value || {} })
    if (res.code === 200) ElMessage.success('命令已下发')
  } catch (e) {
    ElMessage.error('命令下发失败')
  }
}

onMounted(fetchCar)
</script>

<style scoped>
.page-container { padding: 24px; min-height: 100%; }
.page-header { margin-bottom: 20px; }
.page-title { font-size: 22px; font-weight: 600; color: #1f2937; }
.page-desc { font-size: 14px; color: #909399; margin-top: 4px; }
.chart-card { border-radius: 12px; margin-bottom: 20px; }
.table-header { display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: 500; }
.pose-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.pose-item { display: flex; flex-direction: column; gap: 4px; padding: 12px; background: #f8f9fc; border-radius: 8px; }
.pose-label { font-size: 12px; color: #909399; }
.pose-value { font-size: 18px; font-weight: 600; color: #1f2937; }
.info-grid { margin-bottom: 0; }
.control-panel { display: flex; gap: 12px; flex-wrap: wrap; }
</style>

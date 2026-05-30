<template>
  <div class="devices-container" v-loading="loading" element-loading-text="正在加载设备数据...">
    <div class="page-header">
      <div>
        <h2 class="page-title">🖥️ 设备管理</h2>
        <p class="page-desc">实时监控与智能学习桌设备管理</p>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card">
          <template #header>
            <span>🔄 设备状态分布</span>
          </template>
          <div ref="statusChartRef" style="height: 300px"></div>
          <div v-if="statusChartEmpty" class="chart-empty">
            <el-empty description="暂无设备数据" />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="16">
        <el-card class="table-card">
          <template #header>
            <div class="table-header">
              <span>📋 设备列表</span>
              <div class="table-actions">
                <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 130px" size="small" @change="fetchDevices">
                  <el-option label="全部" value="" />
                  <el-option label="在线" value="online" />
                  <el-option label="离线" value="offline" />
                  <el-option label="故障" value="error" />
                </el-select>
                <el-button size="small" type="primary" @click="fetchDevices">
                  <el-icon><Refresh /></el-icon> 刷新
                </el-button>
              </div>
            </div>
          </template>
          <el-table :data="deviceList" border stripe v-loading="tableLoading" empty-text="暂无设备数据">
            <el-table-column prop="id" label="设备ID" width="100" align="center" />
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" effect="dark" size="small">
                  {{ statusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="height" label="桌面高度(cm)" width="130" align="center" />
            <el-table-column prop="light" label="环境亮度(lux)" width="140" align="center" />
            <el-table-column prop="lastUpdateTime" label="最后更新" />
            <el-table-column label="操作" width="140" align="center">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="refreshStatus(row.id)">
                  <el-icon><Refresh /></el-icon> 刷新
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            class="pagination"
            :current-page="pageNum"
            :page-sizes="[10, 20, 50]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalDevices"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import * as echarts from 'echarts'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

const loading = ref(false)
const tableLoading = ref(false)
const statusFilter = ref('')
const deviceList = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const totalDevices = ref(0)

const statusChartRef = ref(null)
let statusChart = null
const statusChartEmpty = ref(false)

const statusType = (s) => s === 'online' ? 'success' : s === 'offline' ? 'warning' : 'danger'
const statusLabel = (s) => s === 'online' ? '在线' : s === 'offline' ? '离线' : '故障'

const fetchDevices = async () => {
  tableLoading.value = true
  try {
    const res = await request.get('/api/devices', { params: { page: pageNum.value, size: pageSize.value } })
    if (res.code === 200 && res.data) {
      let list = res.data.list || []
      if (statusFilter.value) list = list.filter(d => d.status === statusFilter.value)
      deviceList.value = list
      totalDevices.value = res.data.total || 0
    } else {
      deviceList.value = []
      ElMessage.warning('后端数据异常')
    }
  } catch (e) {
    deviceList.value = []
    ElMessage.error('获取设备数据失败，请检查后端是否启动')
  } finally {
    tableLoading.value = false
  }
}

const refreshStatus = async (deviceId) => {
  ElMessage.success(`设备 ${deviceId} 状态已刷新`)
  await fetchDevices()
}

const initStatusChart = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/devices')
    if (res.code === 200 && res.data && res.data.list.length) {
      const count = { online: 0, offline: 0, error: 0 }
      res.data.list.forEach(d => { count[d.status] = (count[d.status] || 0) + 1 })
      const data = Object.entries(count).filter(([, v]) => v > 0)
      if (!data.length) { statusChartEmpty.value = true; return }

      const colorMap = { online: '#67c23a', offline: '#e6a23c', error: '#f56c6c' }
      const nameMap = { online: '在线', offline: '离线', error: '故障' }

      await nextTick()
      statusChart = echarts.init(statusChartRef.value)
      statusChart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} 台 ({d}%)' },
        legend: { bottom: 0 },
        series: [{
          type: 'pie', radius: ['35%', '65%'], center: ['50%', '45%'],
          label: { show: true, formatter: '{b}\n{c}台' },
          data: data.map(([k, v]) => ({ name: nameMap[k] || k, value: v, itemStyle: { color: colorMap[k] } })),
        }],
      })
      window.addEventListener('resize', () => statusChart?.resize())
    } else {
      statusChartEmpty.value = true
    }
  } catch (e) {
    statusChartEmpty.value = true
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val) => { pageSize.value = val; fetchDevices() }
const handleCurrentChange = (val) => { pageNum.value = val; fetchDevices() }

onMounted(async () => {
  await Promise.all([fetchDevices(), initStatusChart()])
})

onUnmounted(() => statusChart?.dispose())
</script>

<style scoped>
.devices-container {
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

.chart-empty {
  margin-top: -300px;
  position: relative;
  z-index: 1;
  pointer-events: none;
}

.table-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 500;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>

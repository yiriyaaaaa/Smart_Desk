<template>
  <div class="devices-container">
    <!-- 页面标题 -->
    <el-page-header @back="goBack" content="设备管理" />

    <!-- 加载状态 -->
    <el-loading v-if="loading" target=".devices-container" text="正在加载设备数据..."></el-loading>

    <!-- 设备状态筛选 -->
    <el-row style="margin: 20px 0;">
      <el-col :span="6">
        <el-select 
          v-model="statusFilter" 
          placeholder="请选择设备状态" 
          style="width: 100%"
          @change="() => fetchDevices(1, pageSize.value)"
        >
          <el-option label="全部" value="" />
          <el-option label="在线" value="online" />
          <el-option label="离线" value="offline" />
          <el-option label="故障" value="error" />
        </el-select>
      </el-col>
      <el-col :span="4">
        <el-button type="primary" :icon="Refresh" @click="() => fetchDevices(1, pageSize.value)">刷新数据</el-button>
      </el-col>
    </el-row>

    <!-- 设备表格（空数据提示） -->
    <el-table 
      :data="deviceList" 
      border 
      style="width: 100%"
      v-loading="tableLoading"
      empty-text="暂无设备数据，请检查后端是否启动"
    >
      <el-table-column prop="id" label="设备ID" width="100" align="center" />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag
            :type="scope.row.status === 'online' ? 'success' : (scope.row.status === 'offline' ? 'warning' : 'danger')"
          >
            {{ scope.row.status === 'online' ? '在线' : (scope.row.status === 'offline' ? '离线' : '故障') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="height" label="桌面高度(cm)" width="120" align="center" />
      <el-table-column prop="light" label="环境亮度(lux)" width="120" align="center" />
      <el-table-column prop="lastUpdateTime" label="最后更新时间" align="center" />
      <el-table-column label="操作" width="150" align="center">
        <template #default="scope">
          <el-button
            type="primary"
            size="small"
            :icon="Refresh"
            @click="refreshDeviceStatus(scope.row.id)"
          >
            刷新状态
          </el-button>
        </template>
      </el-table-column>
    </el-table>

  <!-- 分页 -->
  <el-pagination
    style="margin-top: 20px; text-align: right;"
    :current-page="pageNum"
    :page-sizes="[10,20,50,100]"
    :page-size="pageSize"
    layout="total, sizes, prev, pager, next, jumper"
    :total="totalDevices"
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
  />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { Refresh } from '@element-plus/icons-vue'

// 1. 定义响应式数据
const router = useRouter()
const goBack = () => router.push('/')
const loading = ref(false)          // 整体加载状态
const tableLoading = ref(false)     // 表格加载状态
const statusFilter = ref('')        // 状态筛选值
const deviceList = ref([])          // 设备列表数据
// 分页控制
const pageNum = ref(1)
const pageSize = ref(10)
const totalDevices = ref(0)

// 2. 核心函数：从后端JSON读取设备数据
const fetchDevices = async (page = pageNum.value, size = pageSize.value) => {
  tableLoading.value = true
  try {
    // 调用后端/api/devices接口，带分页参数
    const res = await request.get('/api/devices', { params: { page, size } })
    // 更新分页数据
    pageNum.value = page
    pageSize.value = size
    if (res.code === 200 && res.data) {
      totalDevices.value = res.data.total || (res.data.list ? res.data.list.length : 0)
    }
    // 校验后端返回格式（关键：防止接口返回异常）
    if (res && res.code === 200 && res.data && res.data.list) {
      let list = res.data.list
      // 状态筛选逻辑（修复空值筛选bug）
      if (statusFilter.value) {
        list = list.filter(item => item.status === statusFilter.value)
      }
      // 赋值到页面
      deviceList.value = list
    } else {
      deviceList.value = []
      // 错误提示
      import('element-plus').then(({ ElMessage }) => {
        ElMessage.warning('后端返回数据格式异常，请检查data.json文件')
      })
    }
  } catch (err) {
    deviceList.value = []
    console.error('获取设备数据失败：', err)
    // 友好的错误提示
    import('element-plus').then(({ ElMessage }) => {
      ElMessage.error('获取设备数据失败！请检查：1.后端是否启动 2.接口地址是否正确 3.data.json是否存在')
    })
  } finally {
    tableLoading.value = false
  }
}

// 3. 刷新单个设备状态（模拟功能）
const refreshDeviceStatus = async (deviceId) => {
  try {
    // 模拟刷新状态（真实项目可调用后端更新接口）
    import('element-plus').then(({ ElMessage }) => {
      ElMessage.success(`设备${deviceId}状态已刷新！`)
    })
    // 刷新列表
    await fetchDevices()
  } catch (err) {
    import('element-plus').then(({ ElMessage }) => {
      ElMessage.error(`设备${deviceId}状态刷新失败！`)
    })
  }
}

// 分页事件
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchDevices(1, val)
}
const handleCurrentChange = (val) => {
  pageNum.value = val
  fetchDevices(val, pageSize.value)
}

// 4. 页面挂载时加载数据
onMounted(async () => {
  loading.value = true
  await fetchDevices()
  loading.value = false
})
</script>

<style scoped>
.devices-container {
  padding: 20px;
  min-height: calc(100vh - 120px);
}

/* 优化表格样式 */
:deep(.el-table) {
  --el-table-header-text-color: #333;
  --el-table-row-hover-bg-color: #f5f7fa;
}

:deep(.el-tag) {
  --el-tag-padding: 2px 8px;
  font-size: 12px;
}
</style>
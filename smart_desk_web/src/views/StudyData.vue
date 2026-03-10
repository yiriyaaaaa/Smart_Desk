<template>
  <div class="study-data-container">
    <el-page-header @back="goBack" content="学习记录管理" />
    
    <!-- 筛选条件区域 -->
    <el-row :gutter="20" style="margin: 20px 0;">
      <el-col :span="8">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 100%"
          value-format="YYYY-MM-DD"
        />
      </el-col>
      <el-col :span="8">
        <el-select v-model="selectedUser" placeholder="请选择学生" style="width: 100%">
          <el-option label="全部" value="" />
          <el-option 
            v-for="user in userList" 
            :key="user.id" 
            :label="user.name" 
            :value="user.id" 
          />
        </el-select>
      </el-col>
      <el-col :span="8">
        <el-button type="primary" icon="Search" @click="fetchRecords">查询</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-col>
    </el-row>

    <!-- 学习记录表格 -->
    <el-table 
      :data="studyRecordList" 
      border 
      style="width: 100%" 
      v-loading="loading"
      empty-text="暂无学习记录数据"
    >
      <el-table-column prop="recordId" label="记录ID" width="100" />
      <el-table-column prop="userId" label="学生ID" width="100" />
      <el-table-column prop="userName" label="学生姓名" width="120" />
      <el-table-column prop="startTime" label="开始时间" />
      <el-table-column prop="endTime" label="结束时间" />
      <el-table-column prop="duration" label="时长（分钟）" width="120" />
    </el-table>

    <!-- 分页组件 -->
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="pageNum"
      :page-sizes="[10, 20, 50]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      style="margin-top: 20px; text-align: right;"
    >
    </el-pagination>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

// 筛选条件
const router = useRouter()
const goBack = () => router.push('/')
const dateRange = ref([])
const selectedUser = ref('')

// 分页参数
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 数据列表和加载状态
const studyRecordList = ref([])
const userList = ref([])
const loading = ref(false)

// 重置查询条件
const resetQuery = () => {
  dateRange.value = []
  selectedUser.value = ''
  pageNum.value = 1
  fetchRecords()
}

// 获取用户列表（下拉框用）
const fetchUserList = async () => {
  try {
    const res = await request.get('/api/users')
    if (res.code === 200) {
      userList.value = res.data.list || []
    }
  } catch (err) {
    console.error('加载用户列表失败：', err)
    ElMessage.error('加载用户列表失败')
  }
}

// 获取学习记录（带筛选和分页）
const fetchRecords = async () => {
  try {
    loading.value = true
    const params = {
      page: pageNum.value,
      size: pageSize.value
    }

    // 拼接筛选条件
    if (selectedUser.value) params.userId = selectedUser.value
    if (dateRange.value.length === 2) {
      params.from = dateRange.value[0]
      params.to = dateRange.value[1]
    }

    const res = await request.get('/api/study-sessions', { params })
    if (res.code === 200) {
      studyRecordList.value = res.data.map(item => ({
        ...item,
        userName: item.userName || `未知用户(${item.userId})`
      }))
      total.value = res.total
      pageNum.value = res.page
      pageSize.value = res.size
    }
  } catch (err) {
    console.error('获取学习记录失败：', err)
    ElMessage.error('获取学习记录失败')
  } finally {
    loading.value = false
  }
}

// 分页事件处理
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchRecords()
}

const handleCurrentChange = (val) => {
  pageNum.value = val
  fetchRecords()
}

// 初始化
onMounted(async () => {
  await fetchUserList()
  fetchRecords()
})
</script>

<style scoped>
.study-data-container {
  padding: 20px;
  background: #fff;
  min-height: calc(100vh - 60px);
}

.el-button {
  margin-right: 10px;
}
</style>
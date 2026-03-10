<template>
  <div class="detail-container">
    <el-page-header @back="goBack" content="学生详情" />

    <el-card style="margin: 20px 0;">
      <div class="card-item">
        <div class="label">学生ID：</div><div>{{ studentId }}</div>
      </div>
      <div class="card-item">
        <div class="label">姓名：</div><div>{{ student.name || '-' }}</div>
      </div>
      <div class="card-item">
        <div class="label">班级：</div><div>{{ student.class || '-' }}</div>
      </div>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <div class="card-item">
            <div class="card-title">今日学习时长</div>
            <div class="card-value">{{ (dayStudyTime / 60).toFixed(1) }} 小时</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <div class="card-item">
            <div class="card-title">当前坐姿状态</div>
            <div class="card-value">{{ postureStatus }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../utils/request'

const route = useRoute()
const router = useRouter()
const studentId = route.params.id

// base info
const student = ref({})
// stats
const dayStudyTime = ref(0)
const postureStatus = ref('未知')

const fetchDetail = async () => {
  try {
    // 取学生基本信息
    const res = await request.get('/api/users', { params: { page:1, size:1000 } })
    if (res.code === 200) {
      student.value = res.data.list.find(u => u.id == studentId) || {}
    }
    // 学习时间
    const study = await request.get('/api/study-time', { params: { userId: studentId } })
    if (study.code === 200) {
      dayStudyTime.value = study.data.dayStudyTime || 0
    }
    // 当前坐姿
    const posture = await request.get('/api/posture', { params: { userId: studentId } })
    if (posture.code === 200) {
      postureStatus.value = posture.data.status === 'normal' ? '正确' : '错误'
    }
  } catch (e) {
    console.error('加载详情失败', e)
  }
}

const goBack = () => router.back()

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.detail-container { padding: 20px; }
.card-item { display: flex; justify-content: space-between; margin: 8px 0; }
.card-title { font-size: 14px; color: #666; }
.card-value { font-size: 20px; font-weight: bold; }
.label { width: 80px; color: #444; }
</style>
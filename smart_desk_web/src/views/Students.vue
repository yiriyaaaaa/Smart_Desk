<template>
  <div class="students-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">👥 学生管理</h2>
        <p class="page-desc">查看和管理所有学生信息</p>
      </div>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon> 新增学生
      </el-button>
    </div>

    <el-card class="main-card">
      <div class="toolbar">
        <el-input
          v-model="searchName"
          placeholder="请输入学生姓名搜索"
          clearable
          style="width: 260px"
          @input="onSearchInput"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button :icon="Refresh" @click="fetchStudents">刷新</el-button>
      </div>

      <el-table :data="studentList" border stripe v-loading="loading" empty-text="暂无学生数据">
        <el-table-column prop="id" label="学生ID" width="100" align="center" />
        <el-table-column prop="name" label="姓名" width="140" />
        <el-table-column prop="class" label="班级" width="180" />
        <el-table-column label="今日学习(分钟)" width="160" align="center">
          <template #default="{ row }">
            <el-tag :type="(row.todayStudyTime || 0) > 60 ? 'success' : 'info'">
              {{ row.todayStudyTime ?? 0 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="260">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openEditDialog(row)">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button type="danger" size="small" @click="deleteStudent(row.id)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
            <el-button type="info" size="small" @click="viewDetail(row.id)">
              <el-icon><View /></el-icon> 详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="studentTotal"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑学生' : '新增学生'" width="420px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入学生姓名" />
        </el-form-item>
        <el-form-item label="班级" prop="class">
          <el-input v-model="form.class" placeholder="请输入班级" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import { Plus, Search, Refresh, Edit, Delete, View } from '@element-plus/icons-vue'

const router = useRouter()

const searchName = ref('')
const studentList = ref([])
const studentTotal = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

let searchTimer = null

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const editingId = ref(null)
const form = ref({ name: '', class: '' })

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  class: [{ required: true, message: '请输入班级', trigger: 'blur' }],
}

const fetchStudents = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/users', { params: { page: currentPage.value, size: pageSize.value } })
    if (res.code === 200) {
      let list = res.data.list || []
      if (searchName.value) {
        list = list.filter(item => item.name.includes(searchName.value))
      }
      studentList.value = list
      studentTotal.value = res.data.total || 0
      await Promise.all(studentList.value.map(async stu => {
        try {
          const r = await request.get('/api/study-time', { params: { userId: stu.id } })
          if (r.code === 200) stu.todayStudyTime = r.data.daily ? Object.values(r.data.daily).reduce((a, b) => a + b, 0) : (r.data.totalDuration || 0)
        } catch { stu.todayStudyTime = 0 }
      }))
    }
  } catch (e) {
    console.error('获取学生列表失败:', e)
    ElMessage.error('获取学生列表失败')
  } finally {
    loading.value = false
  }
}

const onSearchInput = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchStudents()
  }, 400)
}

const viewDetail = (id) => {
  router.push({ name: 'StudentDetail', params: { id } })
}

const openCreateDialog = () => {
  isEdit.value = false
  editingId.value = null
  form.value = { name: '', class: '' }
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  editingId.value = row.id
  form.value = { name: row.name, class: row.class }
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value) {
      const res = await request.put(`/api/users/${editingId.value}`, form.value)
      if (res.code === 200) {
        ElMessage.success('修改成功')
        dialogVisible.value = false
        fetchStudents()
      } else {
        ElMessage.error(res.msg || '修改失败')
      }
    } else {
      const res = await request.post('/api/users', form.value)
      if (res.code === 200) {
        ElMessage.success('创建成功')
        dialogVisible.value = false
        fetchStudents()
      } else {
        ElMessage.error(res.msg || '创建失败')
      }
    }
  } catch (e) {
    console.error('提交失败:', e)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const deleteStudent = async (id) => {
  try {
    await ElMessageBox.confirm('确认要删除该学生吗？此操作不可恢复。', '提示', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
    const res = await request.delete(`/api/users/${id}`)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchStudents()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (e) {
    if (e !== 'cancel') console.error('删除出错:', e)
  }
}

const handleSizeChange = (val) => { pageSize.value = val; fetchStudents() }
const handleCurrentChange = (val) => { currentPage.value = val; fetchStudents() }

onMounted(() => fetchStudents())
</script>

<style scoped>
.students-container {
  padding: 24px;
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.main-card {
  border-radius: 12px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>

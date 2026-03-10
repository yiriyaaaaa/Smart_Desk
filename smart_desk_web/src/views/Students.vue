<template>
  <div class="students-container">
    <el-page-header @back="goBack" content="学生管理" />
    <!-- 搜索栏 -->
    <el-row style="margin: 20px 0;">
      <el-col :span="8">
        <el-input placeholder="请输入学生姓名搜索" prefix-icon="Search" v-model="searchName" @input="onSearchInput" />
      </el-col>
      <el-col :span="4">
        <el-button type="primary" icon="Plus" @click="createStudent">新增学生</el-button>
      </el-col>
    </el-row>
    <!-- 学生表格 -->
    <el-table :data="studentList" border style="width: 100%">
      <el-table-column prop="id" label="学生ID" width="100" />
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="class" label="班级" width="140" />
      <el-table-column label="今日学习时长（分钟）" width="180">
        <template #default="{ row }">
          {{ row.todayStudyTime ?? 0 }}
        </template>
      </el-table-column>
      <el-table-column label="操作" >
        <template #default="{ row }">
          <el-button type="primary" size="small" icon="Edit" @click="editStudent(row.id)">编辑</el-button>
          <el-button type="danger" size="small" icon="Delete" @click="deleteStudent(row.id)">删除</el-button>
          <el-button type="info" size="small" icon="View" @click="viewDetail(row.id)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <el-pagination
      style="margin-top: 20px; text-align: right;"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSizeVal"
      layout="total, sizes, prev, pager, next, jumper"
      :total="studentTotal"
    >
    </el-pagination>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

// 获取 router 实例一次即可
const router = useRouter()

// 返回函数 (跳转到 Dashboard)
const goBack = () => {
  router.push('/')
}

// 定义数据
const searchName = ref('')
const studentList = ref([]) // 学生列表（从JSON读取）
const studentTotal = ref(0) // 学生总数
const currentPage = ref(1)
const pageSizeVal = ref(10)

// 从后端JSON读取学生数据（支持分页）
const fetchStudents = async (page = currentPage.value, size = pageSizeVal.value) => {
  try {
    const res = await request.get('/api/users', { params: { page, size } })
    if (res.code === 200) {
      // 更新分页变量（后端可能返回）
      currentPage.value = page
      pageSizeVal.value = size
      // 搜索过滤
      let list = res.data.list
      if (searchName.value) {
        list = list.filter(item => item.name.includes(searchName.value))
      }
      // 预先赋值字段
      studentList.value = list.map(item => ({ ...item, todayStudyTime: 0 }))
      studentTotal.value = res.data.total

      // 为每个学生请求当天学习时长
      await Promise.all(studentList.value.map(async stu => {
        try {
          const r = await request.get('/api/study-time', { params: { userId: stu.id } })
          if (r.code === 200) {
            stu.todayStudyTime = r.data.dayStudyTime || 0
          }
        } catch (e) {
          console.warn('获取学习时间失败', stu.id, e)
        }
      }))
    }
  } catch (err) {
    console.error('获取学生数据失败：', err)
  }
}

// 搜索文本变化处理
const onSearchInput = () => {
  currentPage.value = 1
  fetchStudents()
}

// 跳转到某个学生的详情页
const viewDetail = (id) => {
  console.log('viewDetail called with', id)
  console.log('current route before', router.currentRoute.value.fullPath)
  router.push({ name: 'StudentDetail', params: { id } })
    .then(() => console.log('navigated to', router.currentRoute.value.fullPath))
    .catch(err => console.warn('router push failed', err))
}

// 新增学生
const createStudent = async () => {
  const name = prompt('请输入学生姓名')
  if (!name) return
  const cls = prompt('请输入班级')
  if (!cls) return
  try {
    const res = await request.post('/api/users', { name, class: cls })
    if (res.code === 200) {
      ElMessage.success('添加成功')
      fetchStudents()
    } else {
      ElMessage.error(res.msg || '添加失败')
    }
  } catch (e) {
    console.error('新增出错', e)
    ElMessage.error('新增学生失败')
  }
}

// 编辑学生信息
const editStudent = async (id) => {
  console.log('editStudent called', id)
  const stu = studentList.value.find(s => s.id == id)
  if (!stu) return
  const newName = prompt('请输入姓名', stu.name)
  const newClass = prompt('请输入班级', stu.class)
  if (newName !== null && newClass !== null) {
    try {
      const res = await request.put(`/api/users/${id}`, { name: newName, class: newClass })
      if (res.code === 200) {
        ElMessage.success('修改成功')
        fetchStudents()
      } else {
        ElMessage.error(res.msg || '修改失败')
      }
    } catch (e) {
      console.error('编辑出错', e)
      ElMessage.error('编辑出错')
    }
  }
}

// 删除学生
const deleteStudent = async (id) => {
  console.log('deleteStudent called', id)
  try {
    await ElMessageBox.confirm('确认要删除该学生吗？', '提示', {
      type: 'warning'
    })
    const res = await request.delete(`/api/users/${id}`)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchStudents()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error('删除出错', e)
      ElMessage.error('删除失败')
    }
  }
}

// 分页事件
const handleSizeChange = (val) => {
  pageSizeVal.value = val
  fetchStudents()
}
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchStudents()
}

// 页面挂载时加载数据
onMounted(() => {
  fetchStudents()
})
</script>

<style scoped>
.students-container {
  padding: 20px;
}
</style>
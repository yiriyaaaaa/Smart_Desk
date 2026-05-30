import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

request.interceptors.response.use((response) => {
  return response.data
}, (error) => {
  ElMessage.error(error.message || '请求失败，请检查后端是否启动')
  return Promise.reject(error)
})

export default request
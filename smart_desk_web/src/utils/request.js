import axios from 'axios'

// 创建Axios实例
const request = axios.create({
  // 本地部署填localhost:3000，云部署填云服务器IP:3000
  baseURL: 'http://localhost:3000', 
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 响应拦截器：统一处理返回结果
request.interceptors.response.use((response) => {
  // 后端返回的格式是 {code:200, msg:"success", data:{...}}
  return response.data
}, (error) => {
  // 错误提示
  import('element-plus').then(({ ElMessage }) => {
    ElMessage.error(error.message || '请求失败，请检查后端是否启动')
  })
  return Promise.reject(error)
})

export default request
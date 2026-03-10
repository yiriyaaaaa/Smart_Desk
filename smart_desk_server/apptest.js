const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // 需执行 npm install uuid
const app = express();

// 配置
app.use(cors()); // 解决跨域
app.use(express.json());

// 数据文件路径
const DATA_FILE = path.join(__dirname, 'data.json');

// 工具函数：异步读取JSON数据
const readData = async () => {
  try {
    const data = await fs.promises.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('读取数据失败：', err.message);
    return { users: [], study_sessions: [], devices: [], posture: [] };
  }
};

// 工具函数：异步写入JSON数据
const writeData = async (newData) => {
  try {
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(newData, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('写入数据失败：', err.message);
    return false;
  }
};
// 工具函数：统一成功响应
const sendSuccess = (res, data = null, msg = 'success') => {
  res.json({
    code: 200,
    msg,
    data
  });
};

// 工具函数：统一错误响应
const sendError = (res, code, msg, data = null) => {
  res.json({
    code,
    msg,
    data
  });
};

// 工具函数：校验分页参数
const validatePageParams = (page, size) => {
  const pageNum = isNaN(parseInt(page, 10)) ? 1 : parseInt(page, 10);
  const pageSize = isNaN(parseInt(size, 10)) ? 10 : parseInt(size, 10);
  return {
    pageNum: Math.max(pageNum, 1), // 防止页码小于1
    pageSize: Math.max(Math.min(pageSize, 100), 1) // 限制每页条数1-100
  };
};

// 端口（支持环境变量配置）
const PORT = process.env.PORT || 3000;

// 1. 获取用户列表接口
app.get('/api/users', async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  const { pageNum, pageSize } = validatePageParams(page, size);
  
  const data = await readData();
  const total = data.users.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const list = data.users.slice(start, end);
  const pages = Math.ceil(total / pageSize);

  res.json({
    code: 200,
    msg: 'success',
    data: { list, total },
    page: pageNum,
    size: pageSize,
    pages: pages
  });
});

// 2. 获取单个用户详情接口（RESTful规范）
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params; // 从路径参数获取
  if (!id) {
    return sendError(res, 400, '用户ID不能为空');
  }

  const data = await readData();
  const user = data.users.find(item => item.id == id);
  
  if (user) {
    sendSuccess(res, user);
  } else {
    sendError(res, 404, '用户未找到');
  }
});

// 3. 获取学习时长统计接口（支持日/周/月维度）
app.get('/api/study-time', async (req, res) => {
  const { userId, from, to, granularity = 'day' } = req.query;
  
  if (!userId) {
    return sendError(res, 400, '用户ID不能为空');
  }

  const data = await readData();
  // 1. 过滤用户会话
  let sessions = data.study_sessions.filter(s => s.userId == userId);

  // 2. 时间区间筛选
  if (from) sessions = sessions.filter(s => new Date(s.startTime) >= new Date(from));
  if (to) sessions = sessions.filter(s => new Date(s.endTime) <= new Date(to));

  // 3. 总时长
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);

  // 4. 按维度聚合
  const groupByTime = (sessions, granularity) => {
    const groups = {};
    sessions.forEach(s => {
      let key;
      const start = new Date(s.startTime);
      
      if (granularity === 'day') {
        // 按YYYY-MM-DD分组
        key = start.toISOString().split('T')[0];
      } else if (granularity === 'week') {
        // 按年-周数分组（ISO周）
        const year = start.getFullYear();
        const week = Math.ceil((start.getDate() - start.getDay() + 7) / 7);
        key = `${year}-W${String(week).padStart(2, '0')}`;
      } else if (granularity === 'month') {
        // 按YYYY-MM分组
        key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
      }
      
      groups[key] = (groups[key] || 0) + s.duration;
    });
    return groups;
  };

  const result = groupByTime(sessions, granularity);
  const responseData = {
    totalDuration,
    [granularity === 'day' ? 'daily' : granularity === 'week' ? 'weekly' : 'monthly']: result
  };

  sendSuccess(res, responseData);
});

// 4. 添加学习记录接口
app.post('/api/study-sessions', async (req, res) => {
  const { userId, startTime, endTime } = req.body;

  // 参数校验
  if (!userId || !startTime || !endTime) {
    return sendError(res, 400, 'userId、startTime、endTime为必传参数');
  }

  // 时间格式校验
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return sendError(res, 400, '时间格式不合法，请传入有效时间（如：2024-01-01 08:00:00）');
  }
  if (start >= end) {
    return sendError(res, 400, '开始时间不能晚于结束时间');
  }

  // 计算时长（分钟）
  const duration = Math.round((end - start) / 60000);
  const newSession = {
    recordId: uuidv4(), // 改用uuid保证唯一
    userId,
    startTime,
    endTime,
    duration
  };

  const data = await readData();
  data.study_sessions.push(newSession);
  
  if (await writeData(data)) {
    sendSuccess(res, newSession, '学习记录添加成功');
  } else {
    sendError(res, 500, '添加学习记录失败');
  }
});

// 5. 获取学习记录列表接口
app.get('/api/study-sessions', async (req, res) => {
  const { page = 1, size = 10, userId } = req.query;
  const { pageNum, pageSize } = validatePageParams(page, size);

  const data = await readData();
  // 可选：按用户筛选
  let sessions = userId 
    ? data.study_sessions.filter(s => s.userId == userId)
    : data.study_sessions;

  const total = sessions.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const paginatedSessions = sessions.slice(start, end);
  const pages = Math.ceil(total / pageSize);

  res.json({
    code: 200,
    msg: 'success',
    data: paginatedSessions,
    page: pageNum,
    size: pageSize,
    pages: pages,
    total: total
  });
});

// 6. 获取单个用户学习记录详情接口（按用户ID分页）
app.get('/api/study-sessions/user', async (req, res) => {
  const { userId, page = 1, size = 10 } = req.query;
  const { pageNum, pageSize } = validatePageParams(page, size);

  if (!userId) {
    return sendError(res, 400, 'userId不能为空');
  }

  const data = await readData();
  const sessions = data.study_sessions.filter(s => s.userId == userId);
  const total = sessions.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const paginatedSessions = sessions.slice(start, end);
  const pages = Math.ceil(total / pageSize);

  res.json({
    code: 200,
    msg: 'success',
    data: paginatedSessions,
    page: pageNum,
    size: pageSize,
    pages: pages,
    total: total
  });
});

// 7. 获取当前坐姿状态接口
app.get('/api/posture', async (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return sendError(res, 400, 'userId不能为空');
  }

  const data = await readData();
  const userPosture = data.posture.find(p => p.userId == userId);
  
  if (userPosture) {
    sendSuccess(res, userPosture);
  } else {
    sendError(res, 404, '用户坐姿状态未找到');
  }
});

// 8. 上传/更新坐姿状态接口
app.post('/api/posture', async (req, res) => {
  const { userId, postureStatus, createTime } = req.body;

  if (!userId || !postureStatus || !createTime) {
    return sendError(res, 400, 'userId、postureStatus、createTime为必传参数');
  }

  const data = await readData();
  const index = data.posture.findIndex(p => p.userId == userId);
  
  if (index >= 0) {
    data.posture[index].postureStatus = postureStatus;
    data.posture[index].createTime = createTime;
  } else {
    data.posture.push({ userId, postureStatus, createTime });
  }

  if (await writeData(data)) {
    sendSuccess(res, { userId, postureStatus, createTime }, '坐姿状态更新成功');
  } else {
    sendError(res, 500, '更新坐姿状态失败');
  }
});

// 9. 获取设备列表接口
app.get('/api/devices', async (req, res) => {
  const { page = 1, size = 10 } = req.query;
  const { pageNum, pageSize } = validatePageParams(page, size);

  const data = await readData();
  const total = data.devices.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const paginatedDevices = data.devices.slice(start, end);
  const pages = Math.ceil(total / pageSize);

  res.json({
    code: 200,
    msg: 'success',
    data: {
      list: paginatedDevices,
      total: total
    },
    page: pageNum,
    size: pageSize,
    pages: pages
  });
});

// 10. 获取单个设备详情接口（RESTful规范）
app.get('/api/devices/:id', async (req, res) => {
  const { id } = req.params; // 从路径参数获取
  
  if (!id) {
    return sendError(res, 400, '设备ID不能为空');
  }

  const data = await readData();
  const device = data.devices.find(d => d.id == id);
  
  if (device) {
    sendSuccess(res, device);
  } else {
    sendError(res, 404, '设备未找到');
  }
});

// 11. 上传/更新设备状态
app.put('/api/devices/:id', async (req, res) => {
  const { id: paramId } = req.params;
  const { id, status, height, light } = req.body;

  // 校验参数
  if (!paramId || !id || !status || height === undefined || light === undefined) {
    return sendError(res, 400, '设备ID、状态、高度、亮度为必传参数');
  }
  if (paramId !== id) {
    return sendError(res, 400, '路径ID与请求体ID不一致');
  }

  const data = await readData();
  const index = data.devices.findIndex(d => d.id == id);
  
  if (index >= 0) {
    data.devices[index].status = status;
    data.devices[index].height = height;
    data.devices[index].light = light;
  } else {
    data.devices.push({ id, status, height, light });
  }

  if (await writeData(data)) {
    sendSuccess(res, { id, status, height, light }, '设备状态更新成功');
  } else {
    sendError(res, 500, '更新设备状态失败');
  }
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器异常：', err.stack);
  sendError(res, 500, '服务器内部错误');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`后端服务器已启动：http://localhost:${PORT}`);
  console.log(`数据文件位置：${DATA_FILE}`);
});